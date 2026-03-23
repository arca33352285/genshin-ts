# Math & Vector

**Source**: `src/definitions/nodes.ts`

All math nodes are type `data` unless otherwise noted.

## Arithmetic

| # | Method | nodeType | Line | Notes |
|---|--------|----------|------|-------|
| 1 | `addition(a, b)` | `addition` | 9374 | float / int overloads |
| 2 | `subtraction(a, b)` | `subtraction` | 9411 | |
| 3 | `multiplication(a, b)` | `multiplication` | 8859 | |
| 4 | `division(a, b)` | `division` | 8896 | |
| 5 | `moduloOperation(a, b)` | `modulo_operation` | 9808 | int only |
| 6 | `exponentiation(base, exp)` | `exponentiation` | 9764 | |
| 7 | `absoluteValueOperation(input)` | `absolute_value_operation` | 9559 | |
| 8 | `signOperation(input)` | `sign_operation` | 9870 | |
| 9 | `arithmeticSquareRootOperation(input)` | `arithmetic_square_root_operation` | 9842 | float only |
| 10 | `logarithmOperation(real, base)` | `logarithm_operation` | 8994 | |
| 11 | `takeLargerValue(a, b)` | `take_larger_value` | 9480 | |
| 12 | `takeSmallerValue(a, b)` | `take_smaller_value` | 9521 | |
| 13 | `rangeLimitingOperation(input, lo, hi)` | `range_limiting_operation` | 9121 | clamp |
| 14 | `roundToIntegerOperation(input, mode)` | `round_to_integer_operation` | 9914 | float → int |
| 15 | `pi()` | `pi` | 11131 | constant |
| 16 | `getRandomFloatingPointNumber(lo, hi)` | `get_random_floating_point_number` | 10884 | |
| 17 | `getRandomInteger(lo, hi)` | `get_random_integer` | 10914 | |
| 18 | `weightedRandom(weightList)` | `weighted_random` | 10941 | |

## Trigonometry

| # | Method | nodeType | Line |
|---|--------|----------|------|
| 1 | `sineFunction(radian)` | `sine_function` | 10470 |
| 2 | `cosineFunction(radian)` | `cosine_function` | 10414 |
| 3 | `tangentFunction(radian)` | `tangent_function` | 10442 |
| 4 | `arcsineFunction(input)` | `arcsine_function` | 9087 |
| 5 | `arccosineFunction(input)` | `arccosine_function` | 9031 |
| 6 | `arctangentFunction(input)` | `arctangent_function` | 9059 |
| 7 | `degreesToRadians(angle)` | `degrees_to_radians` | 9449 |
| 8 | `radiansToDegrees(radian)` | `radians_to_degrees` | 9347 |

## 3D Vector

| # | Method | nodeType | Line | Notes |
|---|--------|----------|------|-------|
| 1 | `create3dVector(x, y, z)` | `create3d_vector` | 8955 | |
| 2 | `split3dVector(vec)` | `split3d_vector` | 8794 | |
| 3 | `_3dVectorAddition(v1, v2)` | `_3d_vector_addition` | 9979 | |
| 4 | `_3dVectorSubtraction(v1, v2)` | `_3d_vector_subtraction` | 10060 | |
| 5 | `_3dVectorZoom(vec, mul)` | `_3d_vector_zoom` | 10199 | scalar multiply |
| 6 | `_3dVectorDotProduct(v1, v2)` | `_3d_vector_dot_product` | 10126 | |
| 7 | `_3dVectorCrossProduct(v1, v2)` | `_3d_vector_cross_product` | 10235 | |
| 8 | `_3dVectorAngle(v1, v2)` | `_3d_vector_angle` | 10015 | |
| 9 | `_3dVectorNormalization(vec)` | `_3d_vector_normalization` | 9941 | |
| 10 | `_3dVectorModuloOperation(vec)` | `_3d_vector_modulo_operation` | 10093 | magnitude |
| 11 | `_3dVectorRotation(rot, vec)` | `_3d_vector_rotation` | 10265 | |
| 12 | `directionVectorToRotation(fwd, up)` | `direction_vector_to_rotation` | 9159 | |
| 13 | `distanceBetweenTwoCoordinatePoints(a, b)` | `distance_between_two_coordinate_points` | 9600 | |
| 14 | `_3dVectorForward()` | `_3d_vector_forward` | 11011 | constant |
| 15 | `_3dVectorBackward()` | `_3d_vector_backward` | 10963 | constant |
| 16 | `_3dVectorUp()` | `_3d_vector_up` | 11035 | constant |
| 17 | `_3dVectorDown()` | `_3d_vector_down` | 11059 | constant |
| 18 | `_3dVectorLeft()` | `_3d_vector_left` | 11107 | constant |
| 19 | `_3dVectorRight()` | `_3d_vector_right` | 11083 | constant |
| 20 | `_3dVectorZeroVector()` | `_3d_vector_zero_vector` | 10987 | constant |
