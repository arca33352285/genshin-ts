# Shop & Inventory

**Source**: `src/definitions/nodes.ts`

## Shop Management (exec)

| # | Method | nodeType | Line |
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

## Shop Queries (data)

| # | Method | nodeType | Line |
|---|--------|----------|------|
| 12 | `queryInventoryShopItemSalesInfo(...)` | `query_inventory_shop_item_sales_info` | 14240 |
| 13 | `queryInventoryShopItemSalesList(owner, id)` | `query_inventory_shop_item_sales_list` | 14305 |
| 14 | `queryShopPurchaseItemList(owner, id)` | `query_shop_purchase_item_list` | 14335 |
| 15 | `queryShopItemPurchaseInfo(...)` | `query_shop_item_purchase_info` | 14364 |
| 16 | `queryCustomShopItemSalesList(owner, id)` | `query_custom_shop_item_sales_list` | 14419 |
| 17 | `queryCustomShopItemSalesInfo(...)` | `query_custom_shop_item_sales_info` | 14448 |

## Inventory Actions (exec)

| # | Method | nodeType | Line |
|---|--------|----------|------|
| 18 | `modifyInventoryItemQuantity(...)` | `modify_inventory_item_quantity` | 8096 |
| 19 | `modifyInventoryCurrencyQuantity(...)` | `modify_inventory_currency_quantity` | 8127 |
| 20 | `increaseMaximumInventoryCapacity(...)` | `increase_maximum_inventory_capacity` | 8217 |
| 21 | `triggerLootDrop(dropper, type)` | `trigger_loot_drop` | 8044 |
| 22 | `setLootDropContent(...)` | `set_loot_drop_content` | 8067 |
| 23 | `setInventoryItemDropContents(...)` | `set_inventory_item_drop_contents` | 7980 |
| 24 | `setInventoryDropItemsCurrencyAmount(...)` | `set_inventory_drop_items_currency_amount` | 8014 |

## Inventory Queries (data)

| # | Method | nodeType | Line |
|---|--------|----------|------|
| 25 | `getInventoryItemQuantity(owner, configId)` | `get_inventory_item_quantity` | 14729 |
| 26 | `getInventoryCurrencyQuantity(...)` | `get_inventory_currency_quantity` | 14759 |
| 27 | `getInventoryCapacity(owner)` | `get_inventory_capacity` | 14789 |
| 28 | `getAllBasicItemsFromInventory(owner)` | `get_all_basic_items_from_inventory` | 14841 |
| 29 | `getAllEquipmentFromInventory(owner)` | `get_all_equipment_from_inventory` | 14867 |
| 30 | `getAllCurrencyFromInventory(owner)` | `get_all_currency_from_inventory` | 14815 |
