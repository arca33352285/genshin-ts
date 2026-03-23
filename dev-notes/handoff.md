# Signal Arguments + Injection Hang Bugfix — 변경 내역

- **날짜**: 2026-03-22
- **브랜치**: master (커밋 전)
- **참조 문서**: `D:/MyDrive/Repos/MiliastraWonderland/project-Elementalist/gsmwts/docs/signal-args-*.md`

---

## 1. 변경 개요

| 기능 | 설명 |
|------|------|
| Signal Arguments | `sendSignal()`/`onSignal()`에 커스텀 인자(18종 타입) 지원 추가 |
| Injection Hang Bugfix | `readVarint()` 32비트 오버플로우로 인한 무한 루프 방어 |
| Array Auto-wrap | `sendSignal()`에서 raw JS 배열을 `_list` 타입으로 자동 래핑 |

---

## 2. 수정 파일 목록

### Signal Arguments 기능 (10개)

| # | 파일 | 변경 내용 |
|---|------|----------|
| 1 | `src/compiler/ir_to_gia_transform/mappings.ts` | `SIGNAL_ARG_TYPE_MAP` 상수 추가 (18종 타입 매핑) |
| 2 | `src/definitions/nodes.ts` | `sendSignal()` — signalArgs 파라미터 추가, raw 배열 → `assemblyList` conn 자동 래핑 |
| 3 | `src/runtime/core.ts` | imports 확장 + `onSignal()` signalArgs 파라미터 + `registerEvent()` 동적 출력 핀 |
| 4 | `src/runtime/meta_call_types.ts` | `MetaCallRecord`에 `signalParams` 필드 추가 |
| 5 | `src/runtime/ir_builder.ts` | `buildSignalNode` 추가, NODE_BUILDERS에 send/monitor_signal 등록 |
| 6 | `src/runtime/IR.d.ts` | `Node` 인터페이스에 `signalParams` 필드 추가 |
| 7 | `src/compiler/ir_to_gia_transform/index.ts` | send_signal 인자 핀 생성 + `remapInputIndexForHiddenPin` send_signal 케이스 |
| 8 | `src/compiler/ir_to_gia_transform/pins.ts` | entity null 처리 확장 + `ensureInputPinWithType()` 함수 추가 |
| 9 | `src/runtime/server_globals.d.ts` | `send()` 함수에 args 파라미터 추가 |
| 10 | `src/definitions/events-payload.ts` | `monitorSignal` 페이로드에 `& Record<string, any>` 확장 |
| 11 | `src/runtime/server_globals.ts` | `send()` 글로벌 함수에 args 파라미터 전달 추가 |

### Injection Hang Bugfix (1개)

| # | 파일 | 변경 내용 |
|---|------|----------|
| 11 | `src/injector/signal_nodes.ts` | `readFieldMessages`/`readFieldBytes`/`parseNodeGraphId` 음수 오프셋 방어 + `extractSignalNameFromNode` ClientExec 핀 우선 검색 |

---

## 3. 빌드/테스트 상태

| 항목 | 결과 |
|------|------|
| `npm run build` | PASS |
| `npm run test` | PASS (기존 테스트 전부 통과) |
| genshin-ts-run 컴파일 테스트 (v3) | PASS — 9건 전부 IR/GIA 생성 성공 |
| genshin-ts-run 에디터 인젝션 | **PASS — 9건 전부 인젝션 성공, 에디터에서 직접 확인 완료** |

---

## 4. 테스트 리포트 피드백 반영

| 액션 | 상태 | 설명 |
|------|------|------|
| raw 배열 자동 래핑 | **v3 완료** | v1: parseValue 미지원 → v2: listLiteral GIA assert 실패 → v3: `this.assemblyList()` conn 경유. 에디터 검증 PASS |
| `onSignal` 타입 선언 3번째 인자 | **수정 완료** | `ServerGraphApi` 인터페이스에 `signalArgs?` 파라미터 추가 |
| `vec3_list` 타입 검증 | **PASS** | list() 헬퍼 + raw 배열 모두 정상 |
| raw 배열 vs list() 효율성 | **확인** | raw 배열이 노드 2개 적음 (지역변수 미경유). 문서에 권장 표기 고려 |
| 구현 문서 `evt.entity` 오류 | 미수정 | 외부 문서 (`gsmwts/docs/`) — 이 레포 범위 밖 |
| `entity_list` 타입 검증 | 미검증 | entity는 conn 전용이라 배열 테스트 별도 시나리오 필요 |

---

## 5. 커밋 전 체크리스트

- [x] genshin-ts-run 컴파일 테스트 (9건 전부 PASS)
- [x] raw 배열 자동 래핑 v3 (에디터 검증 PASS)
- [x] vec3_list 테스트 (list 헬퍼 + raw 배열 모두 PASS)
- [x] 에디터 인젝션 검증 (9건 전부 성공)
- [ ] package.json 버전 범프 여부 결정
- [ ] .gitignore에 dev-notes/ 추가 여부 결정
