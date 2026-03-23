# Mode Restrictions

**Source**: `src/definitions/node_modes.ts` (`NODE_TYPE_BY_METHOD`)

Nodes not listed here work in both `beyond` and `classic` modes.

## beyond Mode Only

### Action / Query Methods

| Method | nodeType |
|--------|----------|
| `addCharacterSkill` | `add_character_skill` |
| `changePlayerClass` | `change_player_class` |
| `changePlayerSCurrentClassLevel` | `change_player_s_current_class_level` |
| `clearSpecifiedTargetSAggroList` | `clear_specified_target_s_aggro_list` |
| `consumeGiftBox` | `consume_gift_box` |
| `deleteCharacterSkillById` | `delete_character_skill_by_id` |
| `deleteCharacterSkillBySlot` | `delete_character_skill_by_slot` |
| `getListOfOwnersThatHaveTheTargetAsTheirAggroTarget` | `get_list_of_owners_that_have_the_target_as_their_aggro_target` |
| `getListOfOwnersWhoHaveTheTargetInTheirAggroList` | `get_list_of_owners_who_have_the_target_in_their_aggro_list` |
| `getTheAggroListOfTheSpecifiedEntity` | `get_the_aggro_list_of_the_specified_entity` |
| `getTheAggroTargetOfTheSpecifiedEntity` | `get_the_aggro_target_of_the_specified_entity` |
| `getTheCurrentlyActiveScanTagConfigId` | `get_the_currently_active_scan_tag_config_id` |
| `increasePlayerSCurrentClassExp` | `increase_player_s_current_class_exp` |
| `initializeCharacterSkill` | `initialize_character_skill` |
| `modifyCharacterSkillCd` | `modify_character_skill_cd` |
| `modifyEntityFaction` | `modify_entity_faction` |
| `modifyingCharacterDisruptorDevice` | `modifying_character_disruptor_device` |
| `modifySkillCdPercentageBasedOnMaxCd` | `modify_skill_cd_percentage_based_on_max_cd` |
| `modifySkillResourceAmount` | `modify_skill_resource_amount` |
| `queryCharacterSkill` | `query_character_skill` |
| `queryCorrespondingGiftBoxConsumption` | `query_corresponding_gift_box_consumption` |
| `queryCorrespondingGiftBoxQuantity` | `query_corresponding_gift_box_quantity` |
| `queryGlobalAggroTransferMultiplier` | `query_global_aggro_transfer_multiplier` |
| `queryIfSpecifiedEntityIsInCombat` | `query_if_specified_entity_is_in_combat` |
| `queryPlayerClass` | `query_player_class` |
| `queryPlayerClassLevel` | `query_player_class_level` |
| `queryTheAggroMultiplierOfTheSpecifiedEntity` | `query_the_aggro_multiplier_of_the_specified_entity` |
| `queryTheAggroValueOfTheSpecifiedEntity` | `query_the_aggro_value_of_the_specified_entity` |
| `removeTargetEntityFromAggroList` | `remove_target_entity_from_aggro_list` |
| `reviveCharacter` | `revive_character` |
| `setCharacterSkillCd` | `set_character_skill_cd` |
| `setScanComponentSActiveScanTagId` | `set_scan_component_s_active_scan_tag_id` |
| `setScanTagRules` | `set_scan_tag_rules` |
| `setSkillResourceAmount` | `set_skill_resource_amount` |
| `setTheAggroValueOfSpecifiedEntity` | `set_the_aggro_value_of_specified_entity` |
| `switchMainCameraTemplate` | `switch_main_camera_template` |
| `tauntTarget` | `taunt_target` |

### beyond-Only Events

| Method | nodeType |
|--------|----------|
| `onAggroTargetChanges` | `monitor_aggro_target_changes` |
| `onEnteringAnInterruptibleState` | `monitor_entering_an_interruptible_state` |
| `onEntityFactionChanges` | `monitor_entity_faction_changes` |
| `onPlayerClassChanges` | `monitor_player_class_changes` |
| `onPlayerClassIsRemoved` | `monitor_player_class_is_removed` |
| `onPlayerClassLevelChanges` | `monitor_player_class_level_changes` |
| `onSelfEntersCombat` | `monitor_self_enters_combat` |
| `onSelfLeavesCombat` | `monitor_self_leaves_combat` |
| `onSkillNodeIsCalled` | `monitor_skill_node_is_called` |

---

## classic Mode Only

### Action / Query Methods

| Method | nodeType |
|--------|----------|
| `checkClassicModeCharacterId` | `check_classic_mode_character_id` |
| `getActiveCharacterOfSpecifiedPlayer` | `get_active_character_of_specified_player` |
| `increasesCharacterSElementalEnergy` | `increases_character_s_elemental_energy` |
| `reviveActiveCharacter` | `revive_active_character` |
| `setCharacterSElementalEnergy` | `set_character_s_elemental_energy` |

### classic-Only Events

| Method | nodeType |
|--------|----------|
| `onTheActiveCharacterChanges` | `monitor_the_active_character_changes` |
