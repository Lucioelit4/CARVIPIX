# CARVIPIX Motor Final - QA Downstream Baseline

Captured: 2026-08-09

## Git identity

- Branch: `carvipix-motor-final`
- Initial HEAD: `30408898a56c5556d6e817d5592db96739bf6e9a`
- Initial status SHA-256: `45576fe096e16a1910f508366921512c384e8091992b5eb7dd39d1f7b36e8be4`
- Initial unstaged full diff Git blob: `b119f5d718a069fa7ac55734b2202e66664872d0` (115574 bytes)
- Initial staged full diff Git blob: `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` (0 bytes)
- Initial changed/untracked worktree manifest Git blob: `e21be185bb97bd01eb580ea48eb466f3d98e5160` (5763 bytes)

Recovery commands:

```powershell
git cat-file blob b119f5d718a069fa7ac55734b2202e66664872d0
git cat-file blob e21be185bb97bd01eb580ea48eb466f3d98e5160
```

The worktree manifest maps every initial changed/untracked path to its Git blob and SHA-256. This preserves the complete pre-QA candidate without staging or committing it.

## Frozen historical brain SHA-256

| File | SHA-256 |
| --- | --- |
| `app/ai/cadpV2/snapshotBuilderV3.ts` | `8b25d757d3f8d3ad82a8e3a2171e7f830ac26a87919b0e6c0b5d50f5da19d425` |
| `app/ai/cadpV2/promptBuilderV3.ts` | `589a9cac59a536bc8d8fcbe611836f9d291cdf8686a1e3bdea1d64102bc0bc4a` |
| `app/ai/cadpV2/responseContractV3.ts` | `a8454490479789fdef88e3d479c22347ae9e03d057658dd0ff4e0f25f9088fcb` |
| `app/ai/cadpV2/verifierV3.ts` | `429fb78c9a80b11c12a9d83657f87fd55cc19fb295bc36e35cb1ab253ba8c03f` |
| `app/ai/cadpV2/schedulerAdaptativo.ts` | `881343da959bf44deb398f639b784dc71788134c821434d303169cdde6f73d65` |
| `app/ai/cadpV2/typesMaestroV3.ts` | `f67dbe4b6ea4ca5403bdd34d1c9ab59c3b6b41094f5637773586dc087de863b5` |
| `app/ai/cadpV2/config.ts` | `3be63dbf2cf98ec88403a2bf6ee640204473ba33d7d9673220f4a8219bb95294` |
| `app/ai/cadpV2/paperTradeMonitor.ts` | `abb2f8a9cf1c4a270f4cfe36dce535e616a1715c4508bac274efa8376cd04a98` |
| `INFORME_FORENSE_EXPEDIENTE_HISTORICO_2026-08-09.md` | `f58ae136dd6707edea2d362dc4c48bf6fabaf00cdad70491dd07f6cd391f2da9` |

## Freeze policy

The files above are immutable during downstream QA. Any compatibility correction must be made in the mapper, publisher, lifecycle, dispatcher, MT5 service, endpoint contract, or test harness. No deployment or external delivery is authorized.
