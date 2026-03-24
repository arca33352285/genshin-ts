# genshin-ts 프로젝트 컨텍스트 (현지화용)

## 프로젝트 개요

genshin-ts는 Genshin Impact(원신)의 노드 그래프 시스템을 TypeScript로 작성할 수 있게 해주는 컴파일러/런타임 라이브러리다.

- **컴파일 파이프라인**: TypeScript → `.gs.ts` (노드 함수 호출) → IR `.json` (노드/연결) → `.gia` (인젝션 가능 바이너리)
- **용도**: 원신 에디터의 노드 그래프를 코드로 작성/컴파일/인젝션
- **원본 레포**: josStorer/genshin-ts (중국어 + 영어 JSDoc)
- **현재 포크**: 한국어 현지화 + 개인 기능 추가

## 도메인 용어 사전

### 핵심 개념
| 영어 | 중국어 | 한국어 |
|------|--------|--------|
| Node Graph | 节点图/逻辑图 | 노드 그래프 |
| Entity | 实体 | 엔티티 |
| Pin (Input/Output) | 引脚 (入引脚/出引脚) | 핀 (입력 핀/출력 핀) |
| Execution Flow | 执行流 | 실행 흐름 |
| Branch | 分支 | 브랜치 |
| Variable (Local/Graph) | 变量 (局部/图) | 변수 (로컬/그래프) |
| Signal | 信号 | 시그널 |
| Config ID | 配置ID | 설정 ID |
| Prefab ID | 预制体ID | 프리팹 ID |
| GUID | GUID | GUID |
| Faction | 阵营 | 진영 |
| Cooldown (CD) | 冷却 | 쿨다운 |
| Skill Slot | 技能槽位 | 스킬 슬롯 |
| Timer | 计时器 | 타이머 |

### 게임 관련 용어
| 영어 | 중국어 | 한국어 |
|------|--------|--------|
| Character | 角色 | 캐릭터 |
| Player | 玩家 | 플레이어 |
| Stage/Level | 关卡/舞台 | 스테이지/레벨 |
| Elemental Type | 元素类型 | 원소 타입 |
| Elemental Reaction | 元素反应 | 원소 반응 |
| Unit Status (Buff/Debuff) | 状态/单位状态 | 유닛 상태 (버프/디버프) |
| Damage | 伤害 | 데미지 |
| Hit | 打击/命中 | 히트 |
| Attack | 攻击 | 공격 |
| HP / Health | 生命值 | HP / 체력 |
| Revive | 复活 | 부활 |
| Item | 物品/道具 | 아이템 |
| Loot | 掉落 | 드롭 |
| NPC | NPC | NPC |
| Creature / Monster | 怪物/生物 | 피조물 |
| Object (Entity Type) | 物件 | 오브젝트 |
| Creation (Entity Type) | 造物 | 피조물 |
| Camera | 相机/摄像机 | 카메라 |
| UI Control | UI控件 | UI 컨트롤 |
| Settlement | 结算 | 정산 |
| Motion | 运动 | 모션 |
| Disruptor Device | 干扰装置 | 방해 장치 |
| Interrupt | 打断/受打断 | 경직 |

### 프로그래밍 용어 (그대로 사용)
| 용어 | 한국어 표기 |
|------|------------|
| Integer / Int | 정수 |
| Float | 부동소수점 |
| String / Str | 문자열 |
| Boolean / Bool | 불리언 |
| Vec3 / Vector3 | Vec3 / Vector3 |
| List / Array | 리스트 |
| Dictionary / Dict | 딕셔너리 |
| Enumeration / Enum | 열거형 |
| Expression | 표현식 |
| Comparison | 비교 |
| Logical Operator | 논리 연산자 |
| Mathematical Operator | 수학 연산자 |

### 노드 그래프 전용 용어
| 영어 | 중국어 | 한국어 |
|------|--------|--------|
| Wire / Connection | 连线 | 와이어 / 연결 |
| Loop (For/While) | 循环 | 루프 |
| Break Loop | 跳出循环 | 루프 중단 |
| Return | 终止/返回 | 반환 |
| Continue | 继续 | 계속 |
| Multiple Branches / Switch | 多分支 | 멀티 브랜치 |
| Assembly List | 组装列表 | 어셈블리 리스트 |
| Assembly Dictionary | 组装字典 | 어셈블리 딕셔너리 |
| Data Type Conversion | 数据类型转换 | 데이터 타입 변환 |
| Print String | 打印字符串 | 문자열 프린트 |
| Interrupt | 打断/受打断 | 경직 |

## 현지화 스타일 가이드

1. **게임 용어는 한국어 원신 용어를 따른다** (캐릭터, 원소, 스킬 등)
2. **프로그래밍 용어는 한국 개발자 관습을 따른다** (엔티티, 변수, 리스트 등)
3. **고유명사/타입명은 원문 유지** (Vec3, ConfigId, GUID 등)
4. **설명은 간결하고 자연스러운 한국어로** — 직역 지양, 의역 권장
5. **영어 원문의 의미를 우선** — 중국어와 영어가 다를 경우 영어 기준
6. **@param 설명에서 파라미터 한국어 이름은 콜론으로 구분**: `목표 엔티티: 효과가 적용될 캐릭터 엔티티`
