# genshin-ts 노드 그래프 전체 레퍼런스

- **날짜**: 2026-03-23
- **소스 버전**: master (커밋 a56bb66 기준 + signal-args 미커밋 변경)
- **주 소스 파일**: `src/definitions/nodes.ts` (ServerExecutionFlowFunctions 클래스)

---

## 목차

1. [개요](#1-개요)
2. [흐름 제어 (Flow Control)](#2-흐름-제어)
3. [변수 (Variables)](#3-변수)
4. [데이터 조합/변환 (Data Assembly & Conversion)](#4-데이터-조합변환)
5. [리스트 (List Operations)](#5-리스트)
6. [딕셔너리 (Dictionary Operations)](#6-딕셔너리)
7. [수학/벡터 (Math & Vector)](#7-수학벡터)
8. [논리/비트 (Logic & Bitwise)](#8-논리비트)
9. [비교 (Comparison)](#9-비교)
10. [엔티티 관리 (Entity Management)](#10-엔티티-관리)
11. [엔티티 쿼리 (Entity Queries)](#11-엔티티-쿼리)
12. [충돌/물리 (Collision & Physics)](#12-충돌물리)
13. [모션/경로 (Motion & Pathing)](#13-모션경로)
14. [전투/HP (Combat & HP)](#14-전투hp)
15. [이펙트/투사체 (Effects & Projectiles)](#15-이펙트투사체)
16. [상태/유닛 상태 (Status & Unit Status)](#16-상태유닛-상태)
17. [타이머 (Timers)](#17-타이머)
18. [캐릭터/클래스/스킬 (Character, Class & Skill)](#18-캐릭터클래스스킬)
19. [부활/사망 (Revive & Death)](#19-부활사망)
20. [플레이어 쿼리 (Player Queries)](#20-플레이어-쿼리)
21. [신호 (Signal)](#21-신호)
22. [카메라/UI (Camera & UI)](#22-카메라ui)
23. [오디오 (Audio)](#23-오디오)
24. [태그/어그로 (Tag & Aggro)](#24-태그어그로)
25. [상점/인벤토리 (Shop & Inventory)](#25-상점인벤토리)
26. [장비 (Equipment)](#26-장비)
27. [루트 (Loot)](#27-루트)
28. [정산/순위 (Settlement & Ranking)](#28-정산순위)
29. [미니맵 (Mini-Map)](#29-미니맵)
30. [순찰/웨이포인트 (Patrol & Waypoint)](#30-순찰웨이포인트)
31. [업적/스캔 (Achievement & Scan)](#31-업적스캔)
32. [덱 셀렉터 (Deck Selector)](#32-덱-셀렉터)
33. [환경/시간 (Environment & Time)](#33-환경시간)
34. [채팅/채널 (Chat & Channel)](#34-채팅채널)
35. [기프트 박스 (Gift Box)](#35-기프트-박스)
36. [배포 그룹 (Deployment Group)](#36-배포-그룹)
37. [기타 유틸리티 (Utilities)](#37-기타-유틸리티)
38. [이벤트 (Events)](#38-이벤트)
39. [특수 노드 ID & IR 빌더](#39-특수-노드-id--ir-빌더)
40. [모드 제한 (Mode Restrictions)](#40-모드-제한)

---

## 1. 개요

genshin-ts는 원신 UGC 에디터의 노드 그래프를 TypeScript로 작성하는 라이브러리이다.

**파이프라인**: `.gs.ts` → IR JSON → `.gia` 바이너리

노드는 크게 3가지 타입으로 분류된다:
- **exec**: 실행 흐름 노드 (액션). 순서대로 실행되며 exec 체인으로 연결.
- **event**: 이벤트 리스너. 특정 조건 발생 시 핸들러 실행.
- **data**: 순수 데이터 노드. 값을 계산/조회하여 반환.

**소스 구조**:
| 파일 | 역할 |
|------|------|
| `src/definitions/nodes.ts` | 모든 노드 메서드 정의 (ServerExecutionFlowFunctions 클래스, ~15,500줄) |
| `src/definitions/events.ts` | 이벤트 메타데이터 (ServerEventMetadata, 출력 핀 정의) |
| `src/definitions/events-payload.ts` | 이벤트 핸들러 페이로드 타입 |
| `src/definitions/node_modes.ts` | beyond/classic 모드 제한 |
| `src/runtime/core.ts` | 런타임 이벤트 등록 (onXxx 메서드) |
| `src/runtime/ir_builder.ts` | IR 빌드 시 특수 처리 (NODE_BUILDERS) |
| `src/compiler/ir_to_gia_transform/mappings.ts` | GIA 노드 ID 매핑 (SPECIAL_NODE_IDS) |

---

## 2. 흐름 제어

| # | 메서드 | nodeType | 타입 | 라인 | 설명 |
|---|--------|----------|------|------|------|
| 1 | `return()` | (없음) | 제어 | 714 | 현재 분기 종료 (노드 등록 안 함) |
| 2 | `continue()` | (없음) | 제어 | 735 | 루프 반복 건너뛰기 (노드 등록 안 함) |
| 3 | `breakLoop(loopNodeIds)` | `break_loop` | exec | 2799 | 루프 탈출 |
| 4 | `doubleBranch(condition, trueBranch, falseBranch)` | `double_branch` | exec | 3204 | if/else 분기 |
| 5 | `finiteLoop(count, loopBody)` | `finite_loop` | exec | 2827 | 유한 반복 |
| 6 | `listIterationLoop(list, loopBody)` | `list_iteration_loop` | exec | 2890 | 리스트 순회 |
| 7 | `multipleBranches(input, branches)` | `multiple_branches` | exec | 3014 | switch/case 분기 |

> `break_loop`은 IR 빌더에서 특수 처리됨 (`buildBreakLoopNode`, ir_builder.ts:137)

---

## 3. 변수

| # | 메서드 | nodeType | 타입 | 라인 | 설명 |
|---|--------|----------|------|------|------|
| 1 | `getCustomVariable(entity, name)` | `get_custom_variable` | data | 1612 | 커스텀 변수 읽기 |
| 2 | `setCustomVariable(entity, name, value)` | `set_custom_variable` | exec | — | 커스텀 변수 쓰기 |
| 3 | `getNodeGraphVariable(name)` | `get_node_graph_variable` | data | 1921 | 노드그래프 변수 읽기 |
| 4 | `setNodeGraphVariable(name, value)` | `set_node_graph_variable` | exec | — | 노드그래프 변수 쓰기 |
| 5 | `initLocalVariable(type, init?)` | `init_local_variable` | data | 2012 | 로컬 변수 초기화 |
| 6 | `getLocalVariable(initialValue)` | `get_local_variable` | data | 2219 | 로컬 변수 읽기 |
| 7 | `setLocalVariable(var, value)` | `set_local_variable` | exec | — | 로컬 변수 쓰기 |
| 8 | `queryCustomVariableSnapshot(entity, name)` | `query_custom_variable_snapshot` | data | 2348 | 커스텀 변수 스냅샷 |

---

## 4. 데이터 조합/변환

| # | 메서드 | nodeType | 타입 | 라인 | 설명 |
|---|--------|----------|------|------|------|
| 1 | `assemblyList(items, type?)` | `assembly_list` | data | 1007 | 리스트 조합 (10종 타입) |
| 2 | `emptyList(type)` | `empty_list` | data | 1101 | 빈 리스트 생성 |
| 3 | `emptyLocalVariableList(type)` | (로컬변수+빈리스트) | data | 1145 | 빈 리스트 로컬 변수 |
| 4 | `assemblyDictionary(pairs)` | `assembly_dictionary` | data | 1189 | 딕셔너리 조합 |
| 5 | `createDictionary(keyList, valueList)` | `create_dictionary` | data | 2428 | 키/값 리스트로 딕셔너리 생성 |
| 6 | `dataTypeConversion(input, type)` | `data_type_conversion_{type}` | data | — | 타입 변환 (동적 nodeType) |
| 7 | `assembleStructure()` | `assemble_structure` | data | 10779 | 구조체 조합 (SPECIAL_NODE_ID: 300002) |
| 8 | `splitStructure()` | `split_structure` | data | 10765 | 구조체 분해 (SPECIAL_NODE_ID: 300003) |
| 9 | `modifyStructure()` | `modify_structure` | exec | 7281 | 구조체 수정 (SPECIAL_NODE_ID: 300004) |

**타입 변환 가능 조합** (`DataTypeConversionMap`):

| From | To |
|------|----|
| bool | int, str |
| entity | str |
| faction | str |
| float | int, str |
| guid | str |
| int | bool, float, str |
| vec3 | str |

---

## 5. 리스트

| # | 메서드 | nodeType | 타입 | 라인 |
|---|--------|----------|------|------|
| 1 | `insertValueIntoList(list, id, value)` | `insert_value_into_list` | exec | 3291 |
| 2 | `modifyValueInList(list, id, value)` | `modify_value_in_list` | exec | 3360 |
| 3 | `removeValueFromList(list, id)` | `remove_value_from_list` | exec | 3426 |
| 4 | `clearList(list)` | `clear_list` | exec | 3576 |
| 5 | `listSorting(list, sortBy)` | `list_sorting` | exec | 3486 |
| 6 | `concatenateList(target, input)` | `concatenate_list` | exec | 3515 |
| 7 | `getCorrespondingValueFromList(list, id)` | `get_corresponding_value_from_list` | data | 11230 |
| 8 | `getListLength(list)` | `get_list_length` | data | 11294 |
| 9 | `getMaximumValueFromList(list)` | `get_maximum_value_from_list` | data | 11357 |
| 10 | `getMinimumValueFromList(list)` | `get_minimum_value_from_list` | data | 11388 |
| 11 | `listIncludesThisValue(list, value)` | `list_includes_this_value` | data | 11422 |
| 12 | `searchListAndReturnValueId(list, value)` | `search_list_and_return_value_id` | data | 11159 |

---

## 6. 딕셔너리

| # | 메서드 | nodeType | 타입 | 라인 |
|---|--------|----------|------|------|
| 1 | `queryDictionarySLength(dict)` | `query_dictionary_s_length` | data | — |
| 2 | `queryDictionaryValueByKey(dict, key)` | `query_dictionary_value_by_key` | data | — |
| 3 | `queryIfDictionaryContainsSpecificKey(dict, key)` | `query_if_dictionary_contains_specific_key` | data | — |
| 4 | `queryIfDictionaryContainsSpecificValue(dict, value)` | `query_if_dictionary_contains_specific_value` | data | — |
| 5 | `getListOfKeysFromDictionary(dict)` | `get_list_of_keys_from_dictionary` | data | — |
| 6 | `getListOfValuesFromDictionary(dict)` | `get_list_of_values_from_dictionary` | data | — |
| 7 | `setOrAddKeyValuePairsToDictionary(dict, key, value)` | `set_or_add_key_value_pairs_to_dictionary` | exec | — |
| 8 | `removeKeyValuePairsFromDictionaryByKey(dict, key)` | `remove_key_value_pairs_from_dictionary_by_key` | exec | — |
| 9 | `clearDictionary(dict)` | `clear_dictionary` | exec | — |
| 10 | `sortDictionaryByKey(dict, sortBy)` | `sort_dictionary_by_key` | exec | — |
| 11 | `sortDictionaryByValue(dict, sortBy)` | `sort_dictionary_by_value` | exec | — |

---

## 7. 수학/벡터

### 7.1 산술

| # | 메서드 | nodeType | 라인 | 비고 |
|---|--------|----------|------|------|
| 1 | `addition(a, b)` | `addition` | 9374 | float/int 오버로드 |
| 2 | `subtraction(a, b)` | `subtraction` | 9411 | |
| 3 | `multiplication(a, b)` | `multiplication` | 8859 | |
| 4 | `division(a, b)` | `division` | 8896 | |
| 5 | `moduloOperation(a, b)` | `modulo_operation` | 9808 | int만 |
| 6 | `exponentiation(base, exp)` | `exponentiation` | 9764 | |
| 7 | `absoluteValueOperation(input)` | `absolute_value_operation` | 9559 | |
| 8 | `signOperation(input)` | `sign_operation` | 9870 | |
| 9 | `arithmeticSquareRootOperation(input)` | `arithmetic_square_root_operation` | 9842 | |
| 10 | `logarithmOperation(real, base)` | `logarithm_operation` | 8994 | |
| 11 | `takeLargerValue(a, b)` | `take_larger_value` | 9480 | |
| 12 | `takeSmallerValue(a, b)` | `take_smaller_value` | 9521 | |
| 13 | `rangeLimitingOperation(input, lo, hi)` | `range_limiting_operation` | 9121 | clamp |
| 14 | `roundToIntegerOperation(input, mode)` | `round_to_integer_operation` | 9914 | |
| 15 | `pi()` | `pi` | 11131 | 상수 |

### 7.2 삼각함수

| # | 메서드 | nodeType | 라인 |
|---|--------|----------|------|
| 1 | `sineFunction(radian)` | `sine_function` | 10470 |
| 2 | `cosineFunction(radian)` | `cosine_function` | 10414 |
| 3 | `tangentFunction(radian)` | `tangent_function` | 10442 |
| 4 | `arcsineFunction(input)` | `arcsine_function` | 9087 |
| 5 | `arccosineFunction(input)` | `arccosine_function` | 9031 |
| 6 | `arctangentFunction(input)` | `arctangent_function` | 9059 |
| 7 | `degreesToRadians(angle)` | `degrees_to_radians` | 9449 |
| 8 | `radiansToDegrees(radian)` | `radians_to_degrees` | 9347 |

### 7.3 3D 벡터

| # | 메서드 | nodeType | 라인 |
|---|--------|----------|------|
| 1 | `create3dVector(x, y, z)` | `create3d_vector` | 8955 |
| 2 | `split3dVector(vec)` | `split3d_vector` | 8794 |
| 3 | `_3dVectorAddition(v1, v2)` | `_3d_vector_addition` | 9979 |
| 4 | `_3dVectorSubtraction(v1, v2)` | `_3d_vector_subtraction` | 10060 |
| 5 | `_3dVectorZoom(vec, mul)` | `_3d_vector_zoom` | 10199 |
| 6 | `_3dVectorDotProduct(v1, v2)` | `_3d_vector_dot_product` | 10126 |
| 7 | `_3dVectorCrossProduct(v1, v2)` | `_3d_vector_cross_product` | 10235 |
| 8 | `_3dVectorAngle(v1, v2)` | `_3d_vector_angle` | 10015 |
| 9 | `_3dVectorNormalization(vec)` | `_3d_vector_normalization` | 9941 |
| 10 | `_3dVectorModuloOperation(vec)` | `_3d_vector_modulo_operation` | 10093 |
| 11 | `_3dVectorRotation(rot, vec)` | `_3d_vector_rotation` | 10265 |
| 12 | `directionVectorToRotation(fwd, up)` | `direction_vector_to_rotation` | 9159 |
| 13 | `distanceBetweenTwoCoordinatePoints(a, b)` | `distance_between_two_coordinate_points` | 9600 |
| 14 | `_3dVectorForward()` | `_3d_vector_forward` | 11011 |
| 15 | `_3dVectorBackward()` | `_3d_vector_backward` | 10963 |
| 16 | `_3dVectorUp()` | `_3d_vector_up` | 11035 |
| 17 | `_3dVectorDown()` | `_3d_vector_down` | 11059 |
| 18 | `_3dVectorLeft()` | `_3d_vector_left` | 11107 |
| 19 | `_3dVectorRight()` | `_3d_vector_right` | 11083 |
| 20 | `_3dVectorZeroVector()` | `_3d_vector_zero_vector` | 10987 |

---

## 8. 논리/비트

| # | 메서드 | nodeType | 라인 |
|---|--------|----------|------|
| 1 | `logicalAndOperation(a, b)` | `logical_and_operation` | 9732 |
| 2 | `logicalOrOperation(a, b)` | `logical_or_operation` | 9668 |
| 3 | `logicalXorOperation(a, b)` | `logical_xor_operation` | 9700 |
| 4 | `logicalNotOperation(input)` | `logical_not_operation` | 9637 |
| 5 | `bitwiseAnd(a, b)` | `bitwise_and` | 10575 |
| 6 | `bitwiseOr(a, b)` | `bitwise_or` | 10607 |
| 7 | `xorExclusiveOr(a, b)` | `xor_exclusive_or` | 10639 |
| 8 | `bitwiseComplement(value)` | `bitwise_complement` | 10668 |
| 9 | `leftShiftOperation(val, count)` | `left_shift_operation` | 10501 |
| 10 | `rightShiftOperation(val, count)` | `right_shift_operation` | 10538 |
| 11 | `writeByBit(val, start, end, write)` | `write_by_bit` | 10705 |
| 12 | `readByBit(val, start, end)` | `read_by_bit` | 10745 |

---

## 9. 비교

| # | 메서드 | nodeType | 라인 | 비고 |
|---|--------|----------|------|------|
| 1 | `equal(a, b)` | `equal` | 823 | 10종 타입 오버로드 |
| 2 | `enumerationsEqual(a, b)` | `enumerations_equal` | 906 | 30+ enum 오버로드 |
| 3 | `greaterThan(a, b)` | `greater_than` | 10265 | float/int |
| 4 | `greaterThanOrEqualTo(a, b)` | `greater_than_or_equal_to` | 10303 | |
| 5 | `lessThan(a, b)` | `less_than` | 10341 | |
| 6 | `lessThanOrEqualTo(a, b)` | `less_than_or_equal_to` | 10379 | |

---

## 10. 엔티티 관리

| # | 메서드 | nodeType | 타입 | 라인 |
|---|--------|----------|------|------|
| 1 | `createEntity(guid, tagList)` | `create_entity` | exec | 3697 |
| 2 | `createPrefab(...)` | `create_prefab` | exec | 3739 |
| 3 | `createPrefabGroup(...)` | `create_prefab_group` | exec | 3805 |
| 4 | `destroyEntity(entity)` | `destroy_entity` | exec | 3872 |
| 5 | `removeEntity(entity)` | `remove_entity` | exec | 3891 |
| 6 | `settleStage()` | `settle_stage` | exec | 3906 |
| 7 | `modifyEntityFaction(entity, faction)` | `modify_entity_faction` | exec | 3965 |
| 8 | `activateDisableModelDisplay(entity, activate)` | `activate_disable_model_display` | exec | 3852 |
| 9 | `toggleEntityLightSource(...)` | `toggle_entity_light_source` | exec | 7184 |

---

## 11. 엔티티 쿼리

| # | 메서드 | nodeType | 라인 |
|---|--------|----------|------|
| 1 | `queryIfEntityIsOnTheField(entity)` | `query_if_entity_is_on_the_field` | 11596 |
| 2 | `getAllEntitiesOnTheField()` | `get_all_entities_on_the_field` | 11618 |
| 3 | `getSpecifiedTypeOfEntitiesOnTheField(type)` | `get_specified_type_of_entities_on_the_field` | 11643 |
| 4 | `getEntitiesWithSpecifiedPrefabOnTheField(prefabId)` | `get_entities_with_specified_prefab_on_the_field` | 11669 |
| 5 | `getEntityType(entity)` | `get_entity_type` | 11909 |
| 6 | `getEntityLocationAndRotation(entity)` | `get_entity_location_and_rotation` | 11931 |
| 7 | `getEntityForwardVector(entity)` | `get_entity_forward_vector` | 11977 |
| 8 | `getEntityUpwardVector(entity)` | `get_entity_upward_vector` | 12003 |
| 9 | `getEntityRightVector(entity)` | `get_entity_right_vector` | 12029 |
| 10 | `getEntityListBySpecifiedRange(...)` | `get_entity_list_by_specified_range` | 12529 |
| 11 | `getEntityListBySpecifiedType(list, type)` | `get_entity_list_by_specified_type` | 12564 |
| 12 | `getEntityListBySpecifiedPrefabId(list, prefabId)` | `get_entity_list_by_specified_prefab_id` | 12594 |
| 13 | `getEntityListBySpecifiedFaction(list, faction)` | `get_entity_list_by_specified_faction` | 12627 |
| 14 | `getSelfEntity()` | `get_self_entity` | 12653 |
| 15 | `queryGuidByEntity(entity)` | `query_guid_by_entity` | 12678 |
| 16 | `queryEntityByGuid(guid)` | `query_entity_by_guid` | 12704 |
| 17 | `getListOfEntitiesOwnedByTheEntity(entity)` | `get_list_of_entities_owned_by_the_entity` | 12055 |
| 18 | `getCharacterAttribute(entity)` | `get_character_attribute` | 11691 |
| 19 | `getEntityAdvancedAttribute(entity)` | `get_entity_advanced_attribute` | 11813 |
| 20 | `getEntityElementalAttribute(entity)` | `get_entity_elemental_attribute` | 12077 |
| 21 | `checkEntitySElementalEffectStatus(entity)` | `check_entity_s_elemental_effect_status` | 12259 |
| 22 | `getObjectAttribute(entity)` | `get_object_attribute` | 12401 |
| 23 | `getOwnerEntity(entity)` | `get_owner_entity` | 12497 |
| 24 | `getCreationAttribute(entity)` | `get_creation_attribute` | 13263 |
| 25 | `getCreationSCurrentTarget(entity)` | `get_creation_s_current_target` | 13255 |
| 26 | `getAggroListOfCreationInDefaultMode(entity)` | `get_aggro_list_of_creation_in_default_mode` | 13281 |
| 27 | `queryEntityFaction(entity)` | `query_entity_faction` | 12790 |
| 28 | `queryIfFactionIsHostile(f1, f2)` | `query_if_faction_is_hostile` | 12819 |
| 29 | `getFollowMotionDeviceTarget(entity)` | `get_follow_motion_device_target` | 13153 |

---

## 12. 충돌/물리

| # | 메서드 | nodeType | 라인 |
|---|--------|----------|------|
| 1 | `activateDisableCollisionTrigger(...)` | `activate_disable_collision_trigger` | 4374 |
| 2 | `activateDisableCollisionTriggerSource(entity, activate)` | `activate_disable_collision_trigger_source` | 5787 |
| 3 | `activateDisableExtraCollision(...)` | `activate_disable_extra_collision` | 4266 |
| 4 | `activateDisableExtraCollisionClimbability(...)` | `activate_disable_extra_collision_climbability` | 4297 |
| 5 | `activateDisableNativeCollision(entity, activate)` | `activate_disable_native_collision` | 4325 |
| 6 | `activateDisableNativeCollisionClimbability(entity, activate)` | `activate_disable_native_collision_climbability` | 4348 |
| 7 | `activateDisablePathfindingObstacle(...)` | `activate_disable_pathfinding_obstacle` | 4406 |
| 8 | `activateDisablePathfindingObstacleFeature(entity, activate)` | `activate_disable_pathfinding_obstacle_feature` | 4434 |
| 9 | `getAllEntitiesWithinTheCollisionTrigger(...)` | `get_all_entities_within_the_collision_trigger` | 15037 |

---

## 13. 모션/경로

| # | 메서드 | nodeType | 라인 |
|---|--------|----------|------|
| 1 | `activateBasicMotionDevice(entity, name)` | `activate_basic_motion_device` | 4775 |
| 2 | `activateFixedPointMotionDevice(...)` | `activate_fixed_point_motion_device` | 4725 |
| 3 | `addTargetOrientedRotationBasedMotionDevice(...)` | `add_target_oriented_rotation_based_motion_device` | 4804 |
| 4 | `addUniformBasicLinearMotionDevice(...)` | `add_uniform_basic_linear_motion_device` | 4840 |
| 5 | `addUniformBasicRotationBasedMotionDevice(...)` | `add_uniform_basic_rotation_based_motion_device` | 4879 |
| 6 | `pauseBasicMotionDevice(entity, name)` | `pause_basic_motion_device` | 4948 |
| 7 | `recoverBasicMotionDevice(entity, name)` | `recover_basic_motion_device` | 4681 |
| 8 | `stopAndDeleteBasicMotionDevice(...)` | `stop_and_delete_basic_motion_device` | 4920 |
| 9 | `activateDisableFollowMotionDevice(entity, activate)` | `activate_disable_follow_motion_device` | 4971 |
| 10 | `switchFollowMotionDeviceTargetByGuid(...)` | `switch_follow_motion_device_target_by_guid` | 5009 |
| 11 | `switchFollowMotionDeviceTargetByEntity(...)` | `switch_follow_motion_device_target_by_entity` | 5068 |

---

## 14. 전투/HP

| # | 메서드 | nodeType | 라인 |
|---|--------|----------|------|
| 1 | `initiateAttack(...)` | `initiate_attack` | 4475 |
| 2 | `recoverHp(...)` | `recover_hp` | 4531 |
| 3 | `recoverHpDirectly(...)` | `recover_hp_directly` | 4637 |
| 4 | `hpLoss(...)` | `hp_loss` | 4581 |

---

## 15. 이펙트/투사체

| # | 메서드 | nodeType | 라인 |
|---|--------|----------|------|
| 1 | `createProjectile(...)` | `create_projectile` | 5134 |
| 2 | `playTimedEffects(...)` | `play_timed_effects` | 5205 |
| 3 | `clearSpecialEffectsBasedOnSpecialEffectAssets(...)` | `clear_special_effects_based_on_special_effect_assets` | 5255 |
| 4 | `mountLoopingSpecialEffect(...)` | `mount_looping_special_effect` | 5306 |
| 5 | `clearLoopingSpecialEffect(id, entity)` | `clear_looping_special_effect` | 5359 |

---

## 16. 상태/유닛 상태

| # | 메서드 | nodeType | 타입 | 라인 |
|---|--------|----------|------|------|
| 1 | `setPresetStatus(entity, id, value)` | `set_preset_status` | exec | 3638 |
| 2 | `getPresetStatus(entity, id)` | `get_preset_status` | data | 11490 |
| 3 | `setThePresetStatusValueOfTheComplexCreation(...)` | `set_the_preset_status_value_of_the_complex_creation` | exec | 3669 |
| 4 | `getThePresetStatusValueOfTheComplexCreation(...)` | `get_the_preset_status_value_of_the_complex_creation` | data | 11520 |
| 5 | `addUnitStatus(...)` | `add_unit_status` | exec | 5661 |
| 6 | `removeUnitStatus(...)` | `remove_unit_status` | exec | 5730 |
| 7 | `listOfSlotIdsQueryingUnitStatus(...)` | `list_of_slot_ids_querying_unit_status` | data | 13501 |
| 8 | `queryIfEntityHasUnitStatus(...)` | `query_if_entity_has_unit_status` | data | 13534 |
| 9 | `queryUnitStatusStacksBySlotId(...)` | `query_unit_status_stacks_by_slot_id` | data | 13570 |
| 10 | `queryUnitStatusApplierBySlotId(...)` | `query_unit_status_applier_by_slot_id` | data | 13608 |

---

## 17. 타이머

| # | 메서드 | nodeType | 라인 | 비고 |
|---|--------|----------|------|------|
| 1 | `startTimer(entity, name)` | `start_timer` | 5411 | 엔티티 로컬 |
| 2 | `pauseTimer(entity, name)` | `pause_timer` | 5441 | |
| 3 | `resumeTimer(entity, name)` | `resume_timer` | 5382 | |
| 4 | `stopTimer(entity, name)` | `stop_timer` | 5464 | |
| 5 | `startGlobalTimer(entity, name)` | `start_global_timer` | 5510 | 글로벌 |
| 6 | `modifyGlobalTimer(entity, name, change)` | `modify_global_timer` | 5536 | |
| 7 | `pauseGlobalTimer(entity, name)` | `pause_global_timer` | 5560 | |
| 8 | `recoverGlobalTimer(entity, name)` | `recover_global_timer` | 5487 | |
| 9 | `stopGlobalTimer(entity, name)` | `stop_global_timer` | 5583 | |
| 10 | `getCurrentGlobalTimerTime(entity, name)` | `get_current_global_timer_time` | data | 13229 |

---

## 18. 캐릭터/클래스/스킬

| # | 메서드 | nodeType | 타입 | 라인 | 모드 |
|---|--------|----------|------|------|------|
| 1 | `addCharacterSkill(...)` | `add_character_skill` | exec | 6122 | beyond |
| 2 | `initializeCharacterSkill(...)` | `initialize_character_skill` | exec | 6026 | beyond |
| 3 | `deleteCharacterSkillBySlot(...)` | `delete_character_skill_by_slot` | exec | 6266 | beyond |
| 4 | `deleteCharacterSkillById(entity, configId)` | `delete_character_skill_by_id` | exec | 6292 | beyond |
| 5 | `setCharacterSkillCd(...)` | `set_character_skill_cd` | exec | 6089 | beyond |
| 6 | `modifyCharacterSkillCd(...)` | `modify_character_skill_cd` | exec | 6236 | beyond |
| 7 | `modifySkillCdPercentageBasedOnMaxCd(...)` | `modify_skill_cd_percentage_based_on_max_cd` | exec | 5991 | beyond |
| 8 | `setSkillResourceAmount(...)` | `set_skill_resource_amount` | exec | 6055 | beyond |
| 9 | `modifySkillResourceAmount(...)` | `modify_skill_resource_amount` | exec | 6153 | beyond |
| 10 | `queryCharacterSkill(...)` | `query_character_skill` | data | 13466 | beyond |
| 11 | `changePlayerClass(player, configId)` | `change_player_class` | exec | 5833 | beyond |
| 12 | `changePlayerSCurrentClassLevel(player, level)` | `change_player_s_current_class_level` | exec | 5810 | beyond |
| 13 | `increasePlayerSCurrentClassExp(player, exp)` | `increase_player_s_current_class_exp` | exec | 5856 | beyond |
| 14 | `queryPlayerClass(player)` | `query_player_class` | data | 13439 | beyond |
| 15 | `queryPlayerClassLevel(player, configId)` | `query_player_class_level` | data | 13412 | beyond |
| 16 | `setCharacterSElementalEnergy(entity, energy)` | `set_character_s_elemental_energy` | exec | 6181 | classic |
| 17 | `increasesCharacterSElementalEnergy(...)` | `increases_character_s_elemental_energy` | exec | 6204 | classic |
| 18 | `getActiveCharacterOfSpecifiedPlayer(player)` | `get_active_character_of_specified_player` | data | 13131 | classic |
| 19 | `checkClassicModeCharacterId(character)` | `check_classic_mode_character_id` | data | 13105 | classic |
| 20 | `queryCharacterSCurrentMovementSpd(entity)` | `query_character_s_current_movement_spd` | data | 11550 | — |
| 21 | `modifyingCharacterDisruptorDevice(entity, id)` | `modifying_character_disruptor_device` | exec | 5629 | beyond |

---

## 19. 부활/사망

| # | 메서드 | nodeType | 라인 | 모드 |
|---|--------|----------|------|------|
| 1 | `reviveCharacter(entity)` | `revive_character` | 4020 | beyond |
| 2 | `reviveAllPlayerSCharacters(player, deduct)` | `revive_all_player_s_characters` | 4042 | — |
| 3 | `reviveActiveCharacter(player)` | `revive_active_character` | 4066 | classic |
| 4 | `defeatAllPlayerSCharacters(player)` | `defeat_all_player_s_characters` | 4085 | — |
| 5 | `activateRevivePoint(player, id)` | `activate_revive_point` | 4107 | — |
| 6 | `deactivateRevivePoint(player, id)` | `deactivate_revive_point` | 4240 | — |
| 7 | `allowForbidPlayerToRevive(player, allow)` | `allow_forbid_player_to_revive` | 4217 | — |
| 8 | `setPlayerReviveTime(player, duration)` | `set_player_revive_time` | 4130 | — |
| 9 | `setPlayerRemainingRevives(player, count)` | `set_player_remaining_revives` | 4153 | — |
| 10 | `getPlayerReviveTime(player)` | `get_player_revive_time` | 12980 | — |
| 11 | `getPlayerRemainingRevives(player)` | `get_player_remaining_revives` | 13032 | — |

---

## 20. 플레이어 쿼리

| # | 메서드 | nodeType | 라인 |
|---|--------|----------|------|
| 1 | `getPlayerGuidByPlayerId(id)` | `get_player_guid_by_player_id` | 12876 |
| 2 | `getPlayerIdByPlayerGuid(guid)` | `get_player_id_by_player_guid` | 12902 |
| 3 | `getPlayerClientInputDeviceType(player)` | `get_player_client_input_device_type` | 12928 |
| 4 | `getPlayerEntityToWhichTheCharacterBelongs(char)` | `get_player_entity_to_which_the_character_belongs` | 12954 |
| 5 | `getPlayerNickname(player)` | `get_player_nickname` | 13006 |
| 6 | `getListOfPlayerEntitiesOnTheField()` | `get_list_of_player_entities_on_the_field` | 13054 |
| 7 | `getAllCharacterEntitiesOfSpecifiedPlayer(player)` | `get_all_character_entities_of_specified_player` | 13079 |
| 8 | `queryIfAllPlayerCharactersAreDown(player)` | `query_if_all_player_characters_are_down` | 12846 |
| 9 | `getPlayerSCurrentUiLayout(player)` | `get_player_s_current_ui_layout` | 13229 |
| 10 | `getPlayerRankScoreChange(player, status)` | `get_player_rank_score_change` | 15298 |
| 11 | `getPlayerRankingInfo(player)` | `get_player_ranking_info` | 15321 |
| 12 | `getPlayerEscapeValidity(player)` | `get_player_escape_validity` | 15387 |
| 13 | `setPlayerEscapeValidity(player, valid)` | `set_player_escape_validity` | 8640 |
| 14 | `teleportPlayer(...)` | `teleport_player` | 3995 |

---

## 21. 신호

| # | 메서드 | nodeType | 타입 | 라인 | 비고 |
|---|--------|----------|------|------|------|
| 1 | `sendSignal(name, signalArgs?)` | `send_signal` | exec | 6810 | SPECIAL_NODE_ID: 300000, 커스텀 인자 지원 |
| 2 | `onSignal(name, handler, signalArgs?)` | `monitor_signal` | event | core.ts | SPECIAL_NODE_ID: 300001, 커스텀 인자 수신 |

**지원 인자 타입** (18종, `SIGNAL_ARG_TYPE_MAP` in mappings.ts:402):

| 스칼라 (9종) | 리스트 (9종) |
|-------------|-------------|
| entity | entity_list |
| guid | guid_list |
| int | int_list |
| bool | bool_list |
| float | float_list |
| str | str_list |
| vec3 | vec3_list |
| config_id | config_id_list |
| prefab_id | prefab_id_list |

---

## 22. 카메라/UI

| # | 메서드 | nodeType | 라인 | 모드 |
|---|--------|----------|------|------|
| 1 | `switchMainCameraTemplate(players, name)` | `switch_main_camera_template` | 5606 | beyond |
| 2 | `activateUiControlGroupInControlGroupLibrary(...)` | `activate_ui_control_group_in_control_group_library` | 5879 | — |
| 3 | `switchCurrentInterfaceLayout(player, index)` | `switch_current_interface_layout` | 5905 | — |
| 4 | `removeInterfaceControlGroupFromControlGroupLibrary(...)` | `remove_interface_control_group_from_control_group_library` | 5959 | — |
| 5 | `modifyUiControlStatusWithinTheInterfaceLayout(...)` | `modify_ui_control_status_within_the_interface_layout` | 5931 | — |
| 6 | `setEntityActiveNameplate(...)` | `set_entity_active_nameplate` | 6851 | — |
| 7 | `switchActiveTextBubble(...)` | `switch_active_text_bubble` | 6877 | — |
| 8 | `activateDisableTab(entity, id, activate)` | `activate_disable_tab` | 5763 | — |

---

## 23. 오디오

| # | 메서드 | nodeType | 라인 |
|---|--------|----------|------|
| 1 | `adjustPlayerBackgroundMusicVolume(player, vol)` | `adjust_player_background_music_volume` | 6315 |
| 2 | `adjustSpecifiedSoundEffectPlayer(...)` | `adjust_specified_sound_effect_player` | 6344 |
| 3 | `closeSpecifiedSoundEffectPlayer(entity, id)` | `close_specified_sound_effect_player` | 6374 |
| 4 | `startPausePlayerBackgroundMusic(player, recover)` | `start_pause_player_background_music` | 6397 |
| 5 | `startPauseSpecifiedSoundEffectPlayer(...)` | `start_pause_specified_sound_effect_player` | 6423 |
| 6 | `addSoundEffectPlayer(...)` | `add_sound_effect_player` | 6482 |
| 7 | `playerPlaysOneShot2dSoundEffect(...)` | `player_plays_one_shot2d_sound_effect` | 6547 |
| 8 | `modifyPlayerBackgroundMusic(...)` | `modify_player_background_music` | 6598 |

---

## 24. 태그/어그로

| # | 메서드 | nodeType | 타입 | 라인 | 모드 |
|---|--------|----------|------|------|------|
| 1 | `addUnitTagToEntity(entity, tag)` | `add_unit_tag_to_entity` | exec | 6667 | — |
| 2 | `removeUnitTagFromEntity(entity, tag)` | `remove_unit_tag_from_entity` | exec | 6690 | — |
| 3 | `clearUnitTagsFromEntity(entity)` | `clear_unit_tags_from_entity` | exec | 6645 | — |
| 4 | `getEntityListByUnitTag(tag)` | `get_entity_list_by_unit_tag` | data | 13640 | — |
| 5 | `getEntityUnitTagList(entity)` | `get_entity_unit_tag_list` | data | 13666 | — |
| 6 | `tauntTarget(taunter, target)` | `taunt_target` | exec | 6713 | beyond |
| 7 | `removeTargetEntityFromAggroList(target, owner)` | `remove_target_entity_from_aggro_list` | exec | 6736 | beyond |
| 8 | `clearSpecifiedTargetSAggroList(owner)` | `clear_specified_target_s_aggro_list` | exec | 6756 | beyond |
| 9 | `setTheAggroValueOfSpecifiedEntity(...)` | `set_the_aggro_value_of_specified_entity` | exec | 6781 | beyond |
| 10 | `queryGlobalAggroTransferMultiplier()` | `query_global_aggro_transfer_multiplier` | data | 13688 | beyond |
| 11 | `queryTheAggroMultiplierOfTheSpecifiedEntity(target)` | `query_the_aggro_multiplier_of_the_specified_entity` | data | 13713 | beyond |
| 12 | `queryTheAggroValueOfTheSpecifiedEntity(...)` | `query_the_aggro_value_of_the_specified_entity` | data | 13742 | beyond |
| 13 | `queryIfSpecifiedEntityIsInCombat(target)` | `query_if_specified_entity_is_in_combat` | data | 13772 | beyond |
| 14 | `getListOfOwnersWhoHaveTheTargetInTheirAggroList(target)` | `get_list_of_owners_who_have_the_target_in_their_aggro_list` | data | 13798 | beyond |
| 15 | `getListOfOwnersThatHaveTheTargetAsTheirAggroTarget(target)` | `get_list_of_owners_that_have_the_target_as_their_aggro_target` | data | 13824 | beyond |
| 16 | `getTheAggroListOfTheSpecifiedEntity(entity)` | `get_the_aggro_list_of_the_specified_entity` | data | 13850 | beyond |
| 17 | `getTheAggroTargetOfTheSpecifiedEntity(owner)` | `get_the_aggro_target_of_the_specified_entity` | data | 13876 | beyond |

---

## 25. 상점/인벤토리

### 25.1 상점

| # | 메서드 | nodeType | 라인 |
|---|--------|----------|------|
| 1 | `openShop(player, owner, id)` | `open_shop` | 7398 |
| 2 | `closeShop(player)` | `close_shop` | 7419 |
| 3 | `addNewItemToInventoryShopSalesList(...)` | `add_new_item_to_inventory_shop_sales_list` | 7456 |
| 4 | `addItemsToThePurchaseList(...)` | `add_items_to_the_purchase_list` | 7509 |
| 5 | `addNewItemToCustomShopSalesList(...)` | `add_new_item_to_custom_shop_sales_list` | 7572 |
| 6 | `removeItemFromInventoryShopSalesList(...)` | `remove_item_from_inventory_shop_sales_list` | 7305 |
| 7 | `removeItemFromPurchaseList(...)` | `remove_item_from_purchase_list` | 7336 |
| 8 | `removeItemFromCustomShopSalesList(...)` | `remove_item_from_custom_shop_sales_list` | 7367 |
| 9 | `modifyInventoryShopItemSalesInfo(...)` | `modify_inventory_shop_item_sales_info` | 7640 |
| 10 | `modifyItemPurchaseInfoInThePurchaseList(...)` | `modify_item_purchase_info_in_the_purchase_list` | 7693 |
| 11 | `modifyCustomShopItemSalesInfo(...)` | `modify_custom_shop_item_sales_info` | 7755 |
| 12 | `queryInventoryShopItemSalesInfo(...)` | `query_inventory_shop_item_sales_info` | 14240 |
| 13 | `queryInventoryShopItemSalesList(owner, id)` | `query_inventory_shop_item_sales_list` | 14305 |
| 14 | `queryShopPurchaseItemList(owner, id)` | `query_shop_purchase_item_list` | 14335 |
| 15 | `queryShopItemPurchaseInfo(...)` | `query_shop_item_purchase_info` | 14364 |
| 16 | `queryCustomShopItemSalesList(owner, id)` | `query_custom_shop_item_sales_list` | 14419 |
| 17 | `queryCustomShopItemSalesInfo(...)` | `query_custom_shop_item_sales_info` | 14448 |

### 25.2 인벤토리

| # | 메서드 | nodeType | 라인 |
|---|--------|----------|------|
| 1 | `modifyInventoryItemQuantity(...)` | `modify_inventory_item_quantity` | 8096 |
| 2 | `modifyInventoryCurrencyQuantity(...)` | `modify_inventory_currency_quantity` | 8127 |
| 3 | `getInventoryItemQuantity(owner, configId)` | `get_inventory_item_quantity` | 14729 |
| 4 | `getInventoryCurrencyQuantity(...)` | `get_inventory_currency_quantity` | 14759 |
| 5 | `getInventoryCapacity(owner)` | `get_inventory_capacity` | 14789 |
| 6 | `increaseMaximumInventoryCapacity(...)` | `increase_maximum_inventory_capacity` | 8217 |
| 7 | `getAllBasicItemsFromInventory(owner)` | `get_all_basic_items_from_inventory` | 14841 |
| 8 | `getAllEquipmentFromInventory(owner)` | `get_all_equipment_from_inventory` | 14867 |
| 9 | `getAllCurrencyFromInventory(owner)` | `get_all_currency_from_inventory` | 14815 |
| 10 | `triggerLootDrop(dropper, type)` | `trigger_loot_drop` | 8044 |
| 11 | `setLootDropContent(...)` | `set_loot_drop_content` | 8067 |
| 12 | `setInventoryItemDropContents(...)` | `set_inventory_item_drop_contents` | 7980 |
| 13 | `setInventoryDropItemsCurrencyAmount(...)` | `set_inventory_drop_items_currency_amount` | 8014 |

---

## 26. 장비

| # | 메서드 | nodeType | 타입 | 라인 |
|---|--------|----------|------|------|
| 1 | `replaceEquipmentToTheSpecifiedSlot(...)` | `replace_equipment_to_the_specified_slot` | exec | 7947 |
| 2 | `addAffixToEquipment(...)` | `add_affix_to_equipment` | exec | 7868 |
| 3 | `addAffixToEquipmentAtSpecifiedId(...)` | `add_affix_to_equipment_at_specified_id` | exec | 7907 |
| 4 | `removeEquipmentAffix(equipId, affixId)` | `remove_equipment_affix` | exec | 7839 |
| 5 | `modifyEquipmentAffixValue(...)` | `modify_equipment_affix_value` | exec | 7811 |
| 6 | `getTheEquipmentIndexOfTheSpecifiedEquipmentSlot(...)` | `get_the_equipment_index_of_the_specified_equipment_slot` | data | 14556 |
| 7 | `queryEquipmentTagList(index)` | `query_equipment_tag_list` | data | 14588 |
| 8 | `queryEquipmentConfigIdByEquipmentId(index)` | `query_equipment_config_id_by_equipment_id` | data | 14614 |
| 9 | `getEquipmentAffixList(index)` | `get_equipment_affix_list` | data | 14640 |
| 10 | `getEquipmentAffixConfigId(index, affixId)` | `get_equipment_affix_config_id` | data | 14669 |
| 11 | `getEquipmentAffixValue(index, affixId)` | `get_equipment_affix_value` | data | 14699 |

---

## 27. 루트

| # | 메서드 | nodeType | 라인 |
|---|--------|----------|------|
| 1 | `getLootComponentItemQuantity(loot, configId)` | `get_loot_component_item_quantity` | 14896 |
| 2 | `getLootComponentCurrencyQuantity(...)` | `get_loot_component_currency_quantity` | 14926 |
| 3 | `getAllEquipmentFromLootComponent(loot)` | `get_all_equipment_from_loot_component` | 14956 |
| 4 | `getAllItemsFromLootComponent(dropper)` | `get_all_items_from_loot_component` | 14982 |
| 5 | `getAllCurrencyFromLootComponent(dropper)` | `get_all_currency_from_loot_component` | 15008 |
| 6 | `modifyLootItemComponentQuantity(...)` | `modify_loot_item_component_quantity` | 8158 |
| 7 | `modifyLootComponentCurrencyAmount(...)` | `modify_loot_component_currency_amount` | 8189 |

---

## 28. 정산/순위

| # | 메서드 | nodeType | 타입 | 라인 |
|---|--------|----------|------|------|
| 1 | `setPlayerSettlementSuccessStatus(...)` | `set_player_settlement_success_status` | exec | 7028 |
| 2 | `setPlayerSettlementRankingValue(player, value)` | `set_player_settlement_ranking_value` | exec | 7109 |
| 3 | `setPlayerSettlementScoreboardDataDisplay(...)` | `set_player_settlement_scoreboard_data_display` | exec | 7060 |
| 4 | `setFactionSettlementSuccessStatus(...)` | `set_faction_settlement_success_status` | exec | 7132 |
| 5 | `setFactionSettlementRankingValue(faction, value)` | `set_faction_settlement_ranking_value` | exec | 7158 |
| 6 | `getPlayerSettlementSuccessStatus(player)` | `get_player_settlement_success_status` | data | 14045 |
| 7 | `getPlayerSettlementRankingValue(player)` | `get_player_settlement_ranking_value` | data | 14071 |
| 8 | `getFactionSettlementSuccessStatus(faction)` | `get_faction_settlement_success_status` | data | 14097 |
| 9 | `getFactionSettlementRankingValue(faction)` | `get_faction_settlement_ranking_value` | data | 14123 |
| 10 | `setPlayerLeaderboardScoreAsAFloat(...)` | `set_player_leaderboard_score_as_a_float` | exec | 8416 |
| 11 | `setPlayerLeaderboardScoreAsAnInteger(...)` | `set_player_leaderboard_score_as_an_integer` | exec | 8447 |
| 12 | `setPlayerRankScoreChange(...)` | `set_player_rank_score_change` | exec | 8612 |
| 13 | `switchTheScoringGroupThatAffectsPlayerSCompetitiveRank(...)` | `switch_the_scoring_group_that_affects_player_s_competitive_rank` | exec | 8583 |

---

## 29. 미니맵

| # | 메서드 | nodeType | 타입 | 라인 |
|---|--------|----------|------|------|
| 1 | `modifyPlayerListForVisibleMiniMapMarkers(...)` | `modify_player_list_for_visible_mini_map_markers` | exec | 8246 |
| 2 | `modifyPlayerMarkersOnTheMiniMap(...)` | `modify_player_markers_on_the_mini_map` | exec | 8277 |
| 3 | `modifyMiniMapMarkerActivationStatus(...)` | `modify_mini_map_marker_activation_status` | exec | 8308 |
| 4 | `modifyMiniMapZoom(player, zoom)` | `modify_mini_map_zoom` | exec | 8336 |
| 5 | `modifyPlayerListForTrackingMiniMapMarkers(...)` | `modify_player_list_for_tracking_mini_map_markers` | exec | 8362 |
| 6 | `querySpecifiedMiniMapMarkerInformation(...)` | `query_specified_mini_map_marker_information` | data | 15066 |
| 7 | `getEntitySMiniMapMarkerStatus(entity)` | `get_entity_s_mini_map_marker_status` | data | 15125 |

---

## 30. 순찰/웨이포인트

| # | 메서드 | nodeType | 타입 | 라인 |
|---|--------|----------|------|------|
| 1 | `switchCreationPatrolTemplate(entity, id)` | `switch_creation_patrol_template` | exec | 8390 |
| 2 | `getCurrentCreationSPatrolTemplate(entity)` | `get_current_creation_s_patrol_template` | data | 15180 |
| 3 | `getPresetPointListByUnitTag(tagId)` | `get_preset_point_list_by_unit_tag` | data | 13977 |
| 4 | `queryPresetPointPositionRotation(pointIndex)` | `query_preset_point_position_rotation` | data | 13999 |
| 5 | `getTheNumberOfWaypointsInTheGlobalPath(pathIndex)` | `get_the_number_of_waypoints_in_the_global_path` | data | 13902 |
| 6 | `getSpecifiedWaypointInfo(...)` | `get_specified_waypoint_info` | data | 13927 |

---

## 31. 업적/스캔

| # | 메서드 | nodeType | 타입 | 라인 | 모드 |
|---|--------|----------|------|------|------|
| 1 | `changeAchievementProgressTally(...)` | `change_achievement_progress_tally` | exec | 8478 | — |
| 2 | `setAchievementProgressTally(...)` | `set_achievement_progress_tally` | exec | 8509 | — |
| 3 | `queryIfAchievementIsCompleted(entity, id)` | `query_if_achievement_is_completed` | data | 15242 | — |
| 4 | `setScanTagRules(entity, ruleType)` | `set_scan_tag_rules` | exec | 8537 | beyond |
| 5 | `setScanComponentSActiveScanTagId(entity, id)` | `set_scan_component_s_active_scan_tag_id` | exec | 8560 | beyond |
| 6 | `getTheCurrentlyActiveScanTagConfigId(entity)` | `get_the_currently_active_scan_tag_config_id` | data | 15269 | beyond |

---

## 32. 덱 셀렉터

| # | 메서드 | nodeType | 라인 |
|---|--------|----------|------|
| 1 | `invokeDeckSelector(...)` | `invoke_deck_selector` | 6953 |
| 2 | `closeDeckSelector(player, index)` | `close_deck_selector` | 6903 |
| 3 | `randomDeckSelectorSelectionList(list)` | `random_deck_selector_selection_list` | 7006 |

---

## 33. 환경/시간

| # | 메서드 | nodeType | 타입 | 라인 |
|---|--------|----------|------|------|
| 1 | `setCurrentEnvironmentTime(time)` | `set_current_environment_time` | exec | 3924 |
| 2 | `setEnvironmentTimePassageSpeed(speed)` | `set_environment_time_passage_speed` | exec | 3943 |
| 3 | `modifyEnvironmentSettings(...)` | `modify_environment_settings` | exec | 4182 |
| 4 | `queryCurrentEnvironmentTime()` | `query_current_environment_time` | data | 12722 |
| 5 | `queryGameTimeElapsed()` | `query_game_time_elapsed` | data | 12765 |
| 6 | `queryTimestampUtc0()` | `query_timestamp_utc0` | data | 10856 |
| 7 | `queryServerTimeZone()` | `query_server_time_zone` | data | 10835 |
| 8 | `calculateTimestampFromFormattedTime(...)` | `calculate_timestamp_from_formatted_time` | data | 9201 |
| 9 | `calculateFormattedTimeFromTimestamp(ts)` | `calculate_formatted_time_from_timestamp` | data | 9235 |
| 10 | `calculateDayOfTheWeekFromTimestamp(ts)` | `calculate_day_of_the_week_from_timestamp` | data | 9321 |

---

## 34. 채팅/채널

| # | 메서드 | nodeType | 라인 |
|---|--------|----------|------|
| 1 | `setChatChannelSwitch(index, textSwitch)` | `set_chat_channel_switch` | 8689 |
| 2 | `setPlayerSCurrentChannel(guid, indexList)` | `set_player_s_current_channel` | 8712 |
| 3 | `modifyPlayerChannelPermission(...)` | `modify_player_channel_permission` | 8738 |

---

## 35. 기프트 박스

| # | 메서드 | nodeType | 타입 | 라인 | 모드 |
|---|--------|----------|------|------|------|
| 1 | `consumeGiftBox(...)` | `consume_gift_box` | exec | 8769 | beyond |
| 2 | `queryCorrespondingGiftBoxQuantity(player, index)` | `query_corresponding_gift_box_quantity` | data | 15437 | beyond |
| 3 | `queryCorrespondingGiftBoxConsumption(player, index)` | `query_corresponding_gift_box_consumption` | data | 15467 | beyond |

---

## 36. 배포 그룹

| # | 메서드 | nodeType | 라인 |
|---|--------|----------|------|
| 1 | `activateDisableEntityDeploymentGroup(...)` | `activate_disable_entity_deployment_group` | 8663 |
| 2 | `getCurrentlyActiveEntityDeploymentGroups()` | `get_currently_active_entity_deployment_groups` | 15409 |

---

## 37. 기타 유틸리티

| # | 메서드 | nodeType | 타입 | 라인 |
|---|--------|----------|------|------|
| 1 | `printString(string)` | `print_string` | exec | 3247 |
| 2 | `forwardingEvent(entity)` | `forwarding_event` | exec | 3266 |
| 3 | `getRandomFloatingPointNumber(lo, hi)` | `get_random_floating_point_number` | data | 10884 |
| 4 | `getRandomInteger(lo, hi)` | `get_random_integer` | data | 10914 |
| 5 | `weightedRandom(weightList)` | `weighted_random` | data | 10941 |
| 6 | `queryGameModeAndPlayerNumber()` | `query_game_mode_and_player_number` | data | 10793 |

---

## 38. 이벤트

**소스**: `src/definitions/events.ts` (ServerEventMetadata) + `src/runtime/core.ts` (onXxx 메서드)

| # | 이벤트 메서드 (core.ts) | nodeType | 모드 | 설명 |
|---|------------------------|----------|------|------|
| 1 | `onNodeGraphVariableChanges` | `monitor_node_graph_variable_changes` | — | 노드그래프 변수 변경 |
| 2 | `onCustomVariableChanges` | `monitor_custom_variable_changes` | — | 커스텀 변수 변경 |
| 3 | `onPresetStatusChanges` | `monitor_preset_status_changes` | — | 프리셋 상태 변경 |
| 4 | `onComplexCreationPresetStatusChanges` | `monitor_complex_creation_preset_status_changes` | — | 복합 창조물 프리셋 |
| 5 | `onCharacterMovementSpdMeetsCondition` | `monitor_character_movement_spd_meets_condition` | — | 캐릭터 이동속도 조건 |
| 6 | `onEntityIsCreated` | `monitor_entity_is_created` | — | 엔티티 생성 |
| 7 | `onEntityIsDestroyed` | `monitor_entity_is_destroyed` | — | 엔티티 파괴 |
| 8 | `onEntityIsRemovedDestroyed` | `monitor_entity_is_removed_destroyed` | — | 엔티티 제거/파괴 |
| 9 | `onEntityFactionChanges` | `monitor_entity_faction_changes` | beyond | 진영 변경 |
| 10 | `onTheCharacterIsDown` | `monitor_the_character_is_down` | — | 캐릭터 다운 |
| 11 | `onCharacterRevives` | `monitor_character_revives` | — | 캐릭터 부활 |
| 12 | `onPlayerTeleportCompletes` | `monitor_player_teleport_completes` | — | 텔레포트 완료 |
| 13 | `onAllPlayerSCharactersAreDown` | `monitor_all_player_s_characters_are_down` | — | 전원 다운 |
| 14 | `onAllPlayerSCharactersAreRevived` | `monitor_all_player_s_characters_are_revived` | — | 전원 부활 |
| 15 | `onPlayerIsAbnormallyDownedAndRevives` | `monitor_player_is_abnormally_downed_and_revives` | — | 비정상 다운→부활 |
| 16 | `onTheActiveCharacterChanges` | `monitor_the_active_character_changes` | classic | 활성 캐릭터 변경 |
| 17 | `onEnteringCollisionTrigger` | `monitor_entering_collision_trigger` | — | 충돌 트리거 진입 |
| 18 | `onExitingCollisionTrigger` | `monitor_exiting_collision_trigger` | — | 충돌 트리거 퇴장 |
| 19 | `onHpIsRecovered` | `monitor_hp_is_recovered` | — | HP 회복 (피격측) |
| 20 | `onInitiatingHpRecovery` | `monitor_initiating_hp_recovery` | — | HP 회복 (시전측) |
| 21 | `onAttackHits` | `monitor_attack_hits` | — | 공격 적중 |
| 22 | `onAttacked` | `monitor_attacked` | — | 피격 |
| 23 | `onEnteringAnInterruptibleState` | `monitor_entering_an_interruptible_state` | beyond | 경직 진입 |
| 24 | `onBasicMotionDeviceStops` | `monitor_basic_motion_device_stops` | — | 모션 장치 정지 |
| 25 | `onPathReachesWaypoint` | `monitor_path_reaches_waypoint` | — | 경로 웨이포인트 도달 |
| 26 | `onOnHitDetectionIsTriggered` | `monitor_on_hit_detection_is_triggered` | — | 히트 디텍션 |
| 27 | `onTimerIsTriggered` | `monitor_timer_is_triggered` | — | 타이머 발동 |
| 28 | `onGlobalTimerIsTriggered` | `monitor_global_timer_is_triggered` | — | 글로벌 타이머 발동 |
| 29 | `onUiControlGroupIsTriggered` | `monitor_ui_control_group_is_triggered` | — | UI 컨트롤 그룹 |
| 30 | `onUnitStatusChanges` | `monitor_unit_status_changes` | — | 유닛 상태 변경 |
| 31 | `onUnitStatusEnds` | `monitor_unit_status_ends` | — | 유닛 상태 종료 |
| 32 | `onElementalReactionEventOccurs` | `monitor_elemental_reaction_event_occurs` | — | 원소 반응 |
| 33 | `onShieldIsAttacked` | `monitor_shield_is_attacked` | — | 실드 피격 |
| 34 | `onTabIsSelected` | `monitor_tab_is_selected` | — | 탭 선택 |
| 35 | `onCreationEntersCombat` | `monitor_creation_enters_combat` | — | 창조물 전투 진입 |
| 36 | `onCreationLeavesCombat` | `monitor_creation_leaves_combat` | — | 창조물 전투 이탈 |
| 37 | `onPlayerClassLevelChanges` | `monitor_player_class_level_changes` | beyond | 클래스 레벨 변경 |
| 38 | `onPlayerClassChanges` | `monitor_player_class_changes` | beyond | 클래스 변경 |
| 39 | `onPlayerClassIsRemoved` | `monitor_player_class_is_removed` | beyond | 클래스 제거 |
| 40 | `onSkillNodeIsCalled` | `monitor_skill_node_is_called` | beyond | 스킬 노드 호출 |
| 41 | `onAggroTargetChanges` | `monitor_aggro_target_changes` | beyond | 어그로 대상 변경 |
| 42 | `onSelfEntersCombat` | `monitor_self_enters_combat` | beyond | 자신 전투 진입 |
| 43 | `onSelfLeavesCombat` | `monitor_self_leaves_combat` | beyond | 자신 전투 이탈 |
| 44 | `onSignal` | `monitor_signal` | — | 커스텀 신호 수신 (SPECIAL) |
| 45 | `onDeckSelectorIsComplete` | `monitor_deck_selector_is_complete` | — | 덱 셀렉터 완료 |
| 46 | `onTextBubbleIsCompleted` | `monitor_text_bubble_is_completed` | — | 텍스트 버블 완료 |
| 47 | `onSellingInventoryItemsInTheShop` | `monitor_selling_inventory_items_in_the_shop` | — | 상점 인벤 아이템 판매 |
| 48 | `onCustomShopItemIsSold` | `monitor_custom_shop_item_is_sold` | — | 커스텀 상점 판매 |
| 49 | `onSellingItemsToTheShop` | `monitor_selling_items_to_the_shop` | — | 상점에 아이템 판매 |
| 50 | `onEquipmentIsEquipped` | `monitor_equipment_is_equipped` | — | 장비 장착 |
| 51 | `onEquipmentIsUnequipped` | `monitor_equipment_is_unequipped` | — | 장비 해제 |
| 52 | `onEquipmentIsInitialized` | `monitor_equipment_is_initialized` | — | 장비 초기화 |
| 53 | `onEquipmentAffixValueChanges` | `monitor_equipment_affix_value_changes` | — | 장비 접사 값 변경 |
| 54 | `onItemIsLostFromInventory` | `monitor_item_is_lost_from_inventory` | — | 인벤 아이템 소실 |
| 55 | `onTheQuantityOfInventoryItemChanges` | `monitor_the_quantity_of_inventory_item_changes` | — | 인벤 아이템 수량 변경 |
| 56 | `onItemIsAddedToInventory` | `monitor_item_is_added_to_inventory` | — | 인벤 아이템 추가 |
| 57 | `onTheQuantityOfInventoryCurrencyChanges` | `monitor_the_quantity_of_inventory_currency_changes` | — | 인벤 화폐 변경 |
| 58 | `onItemsInTheInventoryAreUsed` | `monitor_items_in_the_inventory_are_used` | — | 인벤 아이템 사용 |
| 59 | `onCreationReachesPatrolWaypoint` | `monitor_creation_reaches_patrol_waypoint` | — | 순찰 웨이포인트 도달 |

---

## 39. 특수 노드 ID & IR 빌더

### SPECIAL_NODE_IDS (mappings.ts:394)

GIA 벤더 `NODE_ID` 테이블에 없는 노드들은 별도 ID가 할당됨:

| nodeType | ID | 비고 |
|----------|----|------|
| `send_signal` | 300000 | Signal Arguments 커스텀 인자 지원 |
| `monitor_signal` | 300001 | Signal Arguments 커스텀 인자 수신 |
| `assemble_structure` | 300002 | 구조체 조합 |
| `split_structure` | 300003 | 구조체 분해 |
| `modify_structure` | 300004 | 구조체 수정 |

### NODE_BUILDERS (ir_builder.ts:166)

IR 빌드 시 특수 처리가 필요한 노드:

| nodeType | 빌더 함수 | 설명 |
|----------|----------|------|
| `break_loop` | `buildBreakLoopNode` | exec 출력 핀 미연결, 루프 break 입력에 연결 |
| `send_signal` | `buildSignalNode` | `signalParams` 메타데이터 보존 |
| `monitor_signal` | `buildSignalNode` | `signalParams` 메타데이터 보존 |

---

## 40. 모드 제한

**소스**: `src/definitions/node_modes.ts` (NODE_TYPE_BY_METHOD)

### beyond 모드 전용 (37개)

`addCharacterSkill`, `changePlayerClass`, `changePlayerSCurrentClassLevel`, `clearSpecifiedTargetSAggroList`, `consumeGiftBox`, `deleteCharacterSkillById`, `deleteCharacterSkillBySlot`, `getListOfOwnersThatHaveTheTargetAsTheirAggroTarget`, `getListOfOwnersWhoHaveTheTargetInTheirAggroList`, `getTheAggroListOfTheSpecifiedEntity`, `getTheAggroTargetOfTheSpecifiedEntity`, `getTheCurrentlyActiveScanTagConfigId`, `increasePlayerSCurrentClassExp`, `initializeCharacterSkill`, `modifyCharacterSkillCd`, `modifyEntityFaction`, `modifyingCharacterDisruptorDevice`, `modifySkillCdPercentageBasedOnMaxCd`, `modifySkillResourceAmount`, `queryCharacterSkill`, `queryCorrespondingGiftBoxConsumption`, `queryCorrespondingGiftBoxQuantity`, `queryGlobalAggroTransferMultiplier`, `queryIfSpecifiedEntityIsInCombat`, `queryPlayerClass`, `queryPlayerClassLevel`, `queryTheAggroMultiplierOfTheSpecifiedEntity`, `queryTheAggroValueOfTheSpecifiedEntity`, `removeTargetEntityFromAggroList`, `reviveCharacter`, `setCharacterSkillCd`, `setScanComponentSActiveScanTagId`, `setScanTagRules`, `setSkillResourceAmount`, `setTheAggroValueOfSpecifiedEntity`, `switchMainCameraTemplate`, `tauntTarget`

**beyond 이벤트**: `whenAggroTargetChanges`, `whenEnteringAnInterruptibleState`, `whenEntityFactionChanges`, `whenPlayerClassChanges`, `whenPlayerClassIsRemoved`, `whenPlayerClassLevelChanges`, `whenSelfEntersCombat`, `whenSelfLeavesCombat`, `whenSkillNodeIsCalled`

### classic 모드 전용 (5개)

`checkClassicModeCharacterId`, `getActiveCharacterOfSpecifiedPlayer`, `increasesCharacterSElementalEnergy`, `reviveActiveCharacter`, `setCharacterSElementalEnergy`

**classic 이벤트**: `whenTheActiveCharacterChanges`

---

## 부록: 통계

| 항목 | 수량 |
|------|------|
| 액션 노드 (exec) | ~180+ |
| 데이터 노드 (data) | ~120+ |
| 이벤트 노드 (event) | 59 |
| 특수 노드 (SPECIAL_NODE_IDS) | 5 |
| IR 빌더 특수 처리 | 3 |
| beyond 전용 메서드 | 37 |
| classic 전용 메서드 | 5 |
| Signal 인자 타입 | 18 |
