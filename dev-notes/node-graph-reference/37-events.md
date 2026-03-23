# Events

**Source**: `src/definitions/events.ts` (`ServerEventMetadata`) + `src/runtime/core.ts` (`onXxx` methods)

Event nodeType follows the pattern: camelCase method name `onXxx` → `monitor_xxx` (snake_case).

The first three output pins of every event are fixed:
- `OutParam[0]` → `eventSourceEntity`
- `OutParam[1]` → `eventSourceGuid`
- Custom args start at `OutParam[2]` for most events; `OutParam[3]` for `monitorSignal` (which adds `signalSourceEntity`)

| # | `onXxx` Method | nodeType | Mode | Key Output Pins |
|---|----------------|----------|------|-----------------|
| 1 | `onNodeGraphVariableChanges` | `monitor_node_graph_variable_changes` | — | variableName, preChangeValue, postChangeValue |
| 2 | `onCustomVariableChanges` | `monitor_custom_variable_changes` | — | variableName, preChangeValue, postChangeValue |
| 3 | `onPresetStatusChanges` | `monitor_preset_status_changes` | — | presetStatusId, preChangeValue, postChangeValue |
| 4 | `onComplexCreationPresetStatusChanges` | `monitor_complex_creation_preset_status_changes` | — | presetStatusIndex, preChangeValue, postChangeValue |
| 5 | `onCharacterMovementSpdMeetsCondition` | `monitor_character_movement_spd_meets_condition` | — | unitStatusConfigId |
| 6 | `onEntityIsCreated` | `monitor_entity_is_created` | — | — |
| 7 | `onEntityIsDestroyed` | `monitor_entity_is_destroyed` | — | — |
| 8 | `onEntityIsRemovedDestroyed` | `monitor_entity_is_removed_destroyed` | — | — |
| 9 | `onEntityFactionChanges` | `monitor_entity_faction_changes` | beyond | preFaction, postFaction |
| 10 | `onTheCharacterIsDown` | `monitor_the_character_is_down` | — | causeOfBeingDown |
| 11 | `onCharacterRevives` | `monitor_character_revives` | — | — |
| 12 | `onPlayerTeleportCompletes` | `monitor_player_teleport_completes` | — | — |
| 13 | `onAllPlayerSCharactersAreDown` | `monitor_all_player_s_characters_are_down` | — | — |
| 14 | `onAllPlayerSCharactersAreRevived` | `monitor_all_player_s_characters_are_revived` | — | — |
| 15 | `onPlayerIsAbnormallyDownedAndRevives` | `monitor_player_is_abnormally_downed_and_revives` | — | — |
| 16 | `onTheActiveCharacterChanges` | `monitor_the_active_character_changes` | classic | preCharacter, postCharacter |
| 17 | `onEnteringCollisionTrigger` | `monitor_entering_collision_trigger` | — | collisionTriggerEntity, triggerEntity |
| 18 | `onExitingCollisionTrigger` | `monitor_exiting_collision_trigger` | — | collisionTriggerEntity, triggerEntity |
| 19 | `onHpIsRecovered` | `monitor_hp_is_recovered` | — | recoverHpAmount, currentHp, maxHp |
| 20 | `onInitiatingHpRecovery` | `monitor_initiating_hp_recovery` | — | recoverHpAmount |
| 21 | `onAttackHits` | `monitor_attack_hits` | — | targetEntity, attackType, hitType, damage, ... |
| 22 | `onAttacked` | `monitor_attacked` | — | attackerEntity, attackType, hitType, damage, ... |
| 23 | `onEnteringAnInterruptibleState` | `monitor_entering_an_interruptible_state` | beyond | interruptStatus |
| 24 | `onBasicMotionDeviceStops` | `monitor_basic_motion_device_stops` | — | motionDeviceName |
| 25 | `onPathReachesWaypoint` | `monitor_path_reaches_waypoint` | — | waypointId |
| 26 | `onOnHitDetectionIsTriggered` | `monitor_on_hit_detection_is_triggered` | — | hitEntities |
| 27 | `onTimerIsTriggered` | `monitor_timer_is_triggered` | — | timerName |
| 28 | `onGlobalTimerIsTriggered` | `monitor_global_timer_is_triggered` | — | timerName |
| 29 | `onUiControlGroupIsTriggered` | `monitor_ui_control_group_is_triggered` | — | uiControlGroupStatus, uiControlId |
| 30 | `onUnitStatusChanges` | `monitor_unit_status_changes` | — | unitStatusConfigId, slotId, preStackCount, postStackCount, applierEntity |
| 31 | `onUnitStatusEnds` | `monitor_unit_status_ends` | — | unitStatusConfigId, slotId, preStackCount, applierEntity |
| 32 | `onElementalReactionEventOccurs` | `monitor_elemental_reaction_event_occurs` | — | reactionType, attackerEntity, currentHp, maxHp |
| 33 | `onShieldIsAttacked` | `monitor_shield_is_attacked` | — | attackerEntity, shieldDamage, currentShieldHp, maxShieldHp |
| 34 | `onTabIsSelected` | `monitor_tab_is_selected` | — | tabId |
| 35 | `onCreationEntersCombat` | `monitor_creation_enters_combat` | — | — |
| 36 | `onCreationLeavesCombat` | `monitor_creation_leaves_combat` | — | — |
| 37 | `onPlayerClassLevelChanges` | `monitor_player_class_level_changes` | beyond | classConfigId, preLevel, postLevel |
| 38 | `onPlayerClassChanges` | `monitor_player_class_changes` | beyond | preClassConfigId, postClassConfigId |
| 39 | `onPlayerClassIsRemoved` | `monitor_player_class_is_removed` | beyond | classConfigId |
| 40 | `onSkillNodeIsCalled` | `monitor_skill_node_is_called` | beyond | skillSlot |
| 41 | `onAggroTargetChanges` | `monitor_aggro_target_changes` | beyond | preTarget, postTarget |
| 42 | `onSelfEntersCombat` | `monitor_self_enters_combat` | beyond | — |
| 43 | `onSelfLeavesCombat` | `monitor_self_leaves_combat` | beyond | — |
| 44 | `onSignal` | `monitor_signal` | — | signalName, signalSourceEntity + custom signalArgs (OutParam[3+]) |
| 45 | `onDeckSelectorIsComplete` | `monitor_deck_selector_is_complete` | — | deckSelectorIndex, selectedResultList |
| 46 | `onTextBubbleIsCompleted` | `monitor_text_bubble_is_completed` | — | textBubbleIndex |
| 47 | `onSellingInventoryItemsInTheShop` | `monitor_selling_inventory_items_in_the_shop` | — | shopOwnerEntity, shopId, itemConfigId, itemQuantity, price |
| 48 | `onCustomShopItemIsSold` | `monitor_custom_shop_item_is_sold` | — | shopOwnerEntity, shopId, itemId, itemQuantity, price |
| 49 | `onSellingItemsToTheShop` | `monitor_selling_items_to_the_shop` | — | shopOwnerEntity, shopId, itemConfigId, itemQuantity, price |
| 50 | `onEquipmentIsEquipped` | `monitor_equipment_is_equipped` | — | equipmentIndex |
| 51 | `onEquipmentIsUnequipped` | `monitor_equipment_is_unequipped` | — | equipmentIndex |
| 52 | `onEquipmentIsInitialized` | `monitor_equipment_is_initialized` | — | equipmentIndex |
| 53 | `onEquipmentAffixValueChanges` | `monitor_equipment_affix_value_changes` | — | equipmentIndex, affixId, preValue, postValue |
| 54 | `onItemIsLostFromInventory` | `monitor_item_is_lost_from_inventory` | — | itemConfigId, itemQuantity, reasonForItemChange |
| 55 | `onTheQuantityOfInventoryItemChanges` | `monitor_the_quantity_of_inventory_item_changes` | — | itemConfigId, preQuantity, postQuantity, reasonForItemChange |
| 56 | `onItemIsAddedToInventory` | `monitor_item_is_added_to_inventory` | — | itemConfigId, itemQuantity, reasonForItemChange |
| 57 | `onTheQuantityOfInventoryCurrencyChanges` | `monitor_the_quantity_of_inventory_currency_changes` | — | currencyConfigId, preQuantity, postQuantity, reasonForItemChange |
| 58 | `onItemsInTheInventoryAreUsed` | `monitor_items_in_the_inventory_are_used` | — | itemConfigId, itemQuantity |
| 59 | `onCreationReachesPatrolWaypoint` | `monitor_creation_reaches_patrol_waypoint` | — | waypointId |
