import "server-only";

import type { EcosystemServiceLayer } from "./contracts";
import { NoopAuthorizationPort } from "./core/auth";
import { InMemoryBackendCache } from "./core/cache";
import { backendConfig } from "./core/config";
import { InMemoryEnterpriseAuditTrail } from "./core/enterprise-audit";
import { InMemoryServiceEventBus } from "./core/event-bus";
import { normalizeBackendError } from "./core/errors";
import { InMemoryBackendLogger } from "./core/logger";
import { InMemoryObservability } from "./core/observability";
import { InMemoryQueueLayer } from "./core/queue";
import { InMemoryRateLimiter } from "./core/rate-limiter";
import { ServiceContainer } from "./core/service-container";
import { InMemoryScheduler } from "./core/scheduler";
import { AlertsDomainService } from "./services/alerts-domain-service";
import { BotDomainService } from "./services/bot-domain-service";
import { CapitalDomainService } from "./services/capital-domain-service";
import { MembershipsDomainService } from "./services/memberships-domain-service";
import { OperationsDomainService } from "./services/operations-domain-service";
import { PaymentsDomainService } from "./services/payments-domain-service";
import { ResultsDomainService } from "./services/results-domain-service";
import {
  AdminDomainService,
  AIDomainService,
  DashboardDomainService,
  FundingDomainService,
  HistoryDomainService,
  StatsDomainService,
} from "./services/system-domain-services";

function instrumentService<TService extends object>(
  serviceName: string,
  service: TService,
  observability: InMemoryObservability,
  logger: InMemoryBackendLogger
): TService {
  return new Proxy(service, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver) as unknown;
      if (typeof value !== "function") {
        return value;
      }

      return async (...args: unknown[]) => {
        const methodName = String(prop);
        const metric = `backend.service.${serviceName}.${methodName}`;

        return observability.trackAsync(
          metric,
          "service.usage",
          async () => {
            try {
              const result = await Promise.resolve((value as (...params: unknown[]) => unknown).apply(target, args));
              logger.debug("service.call", "Service method executed", {
                service: serviceName,
                method: methodName,
              });
              return result;
            } catch (error) {
              const backendError = normalizeBackendError(error, {
                category: "internal",
                code: "SERVICE_CALL_FAILED",
                source: `service.${serviceName}.${methodName}`,
              });

              logger.error(
                "service.call",
                "Service method failed",
                backendError.toPayload(backendConfig.errors.includeStackInPayload),
                {
                  service: serviceName,
                  method: methodName,
                }
              );

              throw backendError;
            }
          },
          {
            service: serviceName,
            method: methodName,
          }
        );
      };
    },
  });
}

const container = new ServiceContainer();
const logger = new InMemoryBackendLogger(backendConfig.logging.level, "backend");
const observability = new InMemoryObservability(backendConfig.observability.enabled);
const eventBus = new InMemoryServiceEventBus();
const authorization = new NoopAuthorizationPort();
const queueLayer = new InMemoryQueueLayer(backendConfig.queue.defaultMaxRetries);
const scheduler = new InMemoryScheduler(backendConfig.scheduler.maxTasks);
const rateLimiter = new InMemoryRateLimiter();
const cache = new InMemoryBackendCache(backendConfig.cache.defaultTtlMs, backendConfig.cache.maxEntries);
const enterpriseAudit = new InMemoryEnterpriseAuditTrail(backendConfig.audit.maxRecords);

const alertsService = instrumentService(
  "alerts",
  new AlertsDomainService(eventBus),
  observability,
  logger
);
const resultsService = instrumentService(
  "results",
  new ResultsDomainService(eventBus),
  observability,
  logger
);

const ecosystemServices: EcosystemServiceLayer = {
  alerts: alertsService,
  memberships: instrumentService("memberships", new MembershipsDomainService(eventBus), observability, logger),
  payments: instrumentService("payments", new PaymentsDomainService(eventBus), observability, logger),
  bot: instrumentService("bot", new BotDomainService(eventBus), observability, logger),
  capital: instrumentService("capital", new CapitalDomainService(eventBus), observability, logger),
  operations: instrumentService("operations", new OperationsDomainService(eventBus), observability, logger),
  funding: instrumentService("funding", new FundingDomainService(), observability, logger),
  dashboard: instrumentService("dashboard", new DashboardDomainService(), observability, logger),
  results: resultsService,
  admin: instrumentService("admin", new AdminDomainService(), observability, logger),
  ai: instrumentService("ai", new AIDomainService(), observability, logger),
  history: instrumentService("history", new HistoryDomainService(), observability, logger),
  stats: instrumentService("stats", new StatsDomainService(), observability, logger),
};

container.register("config", backendConfig);
container.register("logger", logger);
container.register("observability", observability);
container.register("authorization", authorization);
container.register("queueLayer", queueLayer);
container.register("scheduler", scheduler);
container.register("rateLimiter", rateLimiter);
container.register("cache", cache);
container.register("enterpriseAudit", enterpriseAudit);
container.register("eventBus", eventBus);
container.register("ecosystemServices", ecosystemServices);

export {
  authorization,
  backendConfig,
  cache,
  container,
  ecosystemServices,
  enterpriseAudit,
  eventBus,
  logger,
  observability,
  queueLayer,
  rateLimiter,
  scheduler,
};
