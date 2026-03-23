# Character, Class & Skill

**Source**: `src/definitions/nodes.ts`, `src/definitions/node_modes.ts`

## Skill Management

| # | Method | nodeType | Type | Line | Mode |
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

## Class (Beyond)

| # | Method | nodeType | Type | Line | Mode |
|---|--------|----------|------|------|------|
| 11 | `changePlayerClass(player, configId)` | `change_player_class` | exec | 5833 | beyond |
| 12 | `changePlayerSCurrentClassLevel(player, level)` | `change_player_s_current_class_level` | exec | 5810 | beyond |
| 13 | `increasePlayerSCurrentClassExp(player, exp)` | `increase_player_s_current_class_exp` | exec | 5856 | beyond |
| 14 | `queryPlayerClass(player)` | `query_player_class` | data | 13439 | beyond |
| 15 | `queryPlayerClassLevel(player, configId)` | `query_player_class_level` | data | 13412 | beyond |

## Elemental Energy

| # | Method | nodeType | Type | Line | Mode |
|---|--------|----------|------|------|------|
| 16 | `setCharacterSElementalEnergy(entity, energy)` | `set_character_s_elemental_energy` | exec | 6181 | classic |
| 17 | `increasesCharacterSElementalEnergy(...)` | `increases_character_s_elemental_energy` | exec | 6204 | classic |

## Movement & State

| # | Method | nodeType | Type | Line | Mode |
|---|--------|----------|------|------|------|
| 18 | `queryCharacterSCurrentMovementSpd(entity)` | `query_character_s_current_movement_spd` | data | 11550 | — |
| 19 | `modifyingCharacterDisruptorDevice(entity, id)` | `modifying_character_disruptor_device` | exec | 5629 | beyond |

## Classic-Only Queries

| # | Method | nodeType | Type | Line | Mode |
|---|--------|----------|------|------|------|
| 20 | `getActiveCharacterOfSpecifiedPlayer(player)` | `get_active_character_of_specified_player` | data | 13131 | classic |
| 21 | `checkClassicModeCharacterId(character)` | `check_classic_mode_character_id` | data | 13105 | classic |
