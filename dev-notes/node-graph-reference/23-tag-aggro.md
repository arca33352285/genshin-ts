# Tag & Aggro

**Source**: `src/definitions/nodes.ts`

## Unit Tags

| # | Method | nodeType | Type | Line | Mode |
|---|--------|----------|------|------|------|
| 1 | `addUnitTagToEntity(entity, tag)` | `add_unit_tag_to_entity` | exec | 6667 | — |
| 2 | `removeUnitTagFromEntity(entity, tag)` | `remove_unit_tag_from_entity` | exec | 6690 | — |
| 3 | `clearUnitTagsFromEntity(entity)` | `clear_unit_tags_from_entity` | exec | 6645 | — |
| 4 | `getEntityListByUnitTag(tag)` | `get_entity_list_by_unit_tag` | data | 13640 | — |
| 5 | `getEntityUnitTagList(entity)` | `get_entity_unit_tag_list` | data | 13666 | — |

## Aggro / Combat Target

| # | Method | nodeType | Type | Line | Mode |
|---|--------|----------|------|------|------|
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
