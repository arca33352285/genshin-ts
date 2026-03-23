# Entity Queries

**Source**: `src/definitions/nodes.ts`

All nodes are type `data`.

## Existence / Field Queries

| # | Method | nodeType | Line |
|---|--------|----------|------|
| 1 | `queryIfEntityIsOnTheField(entity)` | `query_if_entity_is_on_the_field` | 11596 |
| 2 | `getAllEntitiesOnTheField()` | `get_all_entities_on_the_field` | 11618 |
| 3 | `getSpecifiedTypeOfEntitiesOnTheField(type)` | `get_specified_type_of_entities_on_the_field` | 11643 |
| 4 | `getEntitiesWithSpecifiedPrefabOnTheField(prefabId)` | `get_entities_with_specified_prefab_on_the_field` | 11669 |
| 5 | `getSelfEntity()` | `get_self_entity` | 12653 |
| 6 | `getOwnerEntity(entity)` | `get_owner_entity` | 12497 |
| 7 | `getListOfEntitiesOwnedByTheEntity(entity)` | `get_list_of_entities_owned_by_the_entity` | 12055 |

## Identity

| # | Method | nodeType | Line |
|---|--------|----------|------|
| 8 | `getEntityType(entity)` | `get_entity_type` | 11909 |
| 9 | `queryGuidByEntity(entity)` | `query_guid_by_entity` | 12678 |
| 10 | `queryEntityByGuid(guid)` | `query_entity_by_guid` | 12704 |
| 11 | `queryEntityFaction(entity)` | `query_entity_faction` | 12790 |
| 12 | `queryIfFactionIsHostile(f1, f2)` | `query_if_faction_is_hostile` | 12819 |

## Spatial / Transform

| # | Method | nodeType | Line |
|---|--------|----------|------|
| 13 | `getEntityLocationAndRotation(entity)` | `get_entity_location_and_rotation` | 11931 |
| 14 | `getEntityForwardVector(entity)` | `get_entity_forward_vector` | 11977 |
| 15 | `getEntityUpwardVector(entity)` | `get_entity_upward_vector` | 12003 |
| 16 | `getEntityRightVector(entity)` | `get_entity_right_vector` | 12029 |

## Filtered Entity Lists

| # | Method | nodeType | Line |
|---|--------|----------|------|
| 17 | `getEntityListBySpecifiedRange(...)` | `get_entity_list_by_specified_range` | 12529 |
| 18 | `getEntityListBySpecifiedType(list, type)` | `get_entity_list_by_specified_type` | 12564 |
| 19 | `getEntityListBySpecifiedPrefabId(list, prefabId)` | `get_entity_list_by_specified_prefab_id` | 12594 |
| 20 | `getEntityListBySpecifiedFaction(list, faction)` | `get_entity_list_by_specified_faction` | 12627 |

## Attributes

| # | Method | nodeType | Line |
|---|--------|----------|------|
| 21 | `getCharacterAttribute(entity)` | `get_character_attribute` | 11691 |
| 22 | `getEntityAdvancedAttribute(entity)` | `get_entity_advanced_attribute` | 11813 |
| 23 | `getEntityElementalAttribute(entity)` | `get_entity_elemental_attribute` | 12077 |
| 24 | `checkEntitySElementalEffectStatus(entity)` | `check_entity_s_elemental_effect_status` | 12259 |
| 25 | `getObjectAttribute(entity)` | `get_object_attribute` | 12401 |
| 26 | `getCreationAttribute(entity)` | `get_creation_attribute` | 13263 |
| 27 | `getCreationSCurrentTarget(entity)` | `get_creation_s_current_target` | 13255 |
| 28 | `getAggroListOfCreationInDefaultMode(entity)` | `get_aggro_list_of_creation_in_default_mode` | 13281 |
| 29 | `getFollowMotionDeviceTarget(entity)` | `get_follow_motion_device_target` | 13153 |
