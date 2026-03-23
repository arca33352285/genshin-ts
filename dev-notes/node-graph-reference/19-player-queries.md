# Player Queries

**Source**: `src/definitions/nodes.ts`

All nodes are type `data` unless otherwise noted.

| # | Method | nodeType | Type | Line |
|---|--------|----------|------|------|
| 1 | `getPlayerGuidByPlayerId(id)` | `get_player_guid_by_player_id` | data | 12876 |
| 2 | `getPlayerIdByPlayerGuid(guid)` | `get_player_id_by_player_guid` | data | 12902 |
| 3 | `getPlayerClientInputDeviceType(player)` | `get_player_client_input_device_type` | data | 12928 |
| 4 | `getPlayerEntityToWhichTheCharacterBelongs(char)` | `get_player_entity_to_which_the_character_belongs` | data | 12954 |
| 5 | `getPlayerNickname(player)` | `get_player_nickname` | data | 13006 |
| 6 | `getListOfPlayerEntitiesOnTheField()` | `get_list_of_player_entities_on_the_field` | data | 13054 |
| 7 | `getAllCharacterEntitiesOfSpecifiedPlayer(player)` | `get_all_character_entities_of_specified_player` | data | 13079 |
| 8 | `queryIfAllPlayerCharactersAreDown(player)` | `query_if_all_player_characters_are_down` | data | 12846 |
| 9 | `getPlayerSCurrentUiLayout(player)` | `get_player_s_current_ui_layout` | data | 13229 |
| 10 | `getPlayerRankScoreChange(player, status)` | `get_player_rank_score_change` | data | 15298 |
| 11 | `getPlayerRankingInfo(player)` | `get_player_ranking_info` | data | 15321 |
| 12 | `getPlayerEscapeValidity(player)` | `get_player_escape_validity` | data | 15387 |
| 13 | `setPlayerEscapeValidity(player, valid)` | `set_player_escape_validity` | exec | 8640 |
