# oriented/tile

## GET /oriented/tile

**Returns an oriented image tile.**

### Introduction

This service will deliver an oriented tile from a specified image, a tile being a 256x256 pixel portion of the image. Every image is available at full, 1/2, 1/4, and 1/8 of the original resolution, and then they are cut into 256x256 pixel tiles starting with the upper left corner. This service will be useful for creating mapping application integrations with oblique imagery. This service will allow downloading an image tile-by-tile, significantly improving the users's loading time by avoiding the download of non-visible parts of the image according to the user's viewing extent.

<img src="../resources/img/docs/oriented_tile.jpg"/>

### Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| image-name | query | True | string | The image name(s) for the image(s). Multiple values must be separated by a comma. |
| downsample | query | True | integer | The resolution of the requested image |
| tile-x | query | True | integer | The number to identify the row of the tile along the x-axis. Column 0 being the top-most column in the image. |
| tile-y | query | True | integer | The number to identify the column of the tile along the y-axis. Column 0 being the left-most column in the image. |
| bands | query | False | string | The color bands in which the returned image will be comprised of.<br><br><i>Available values</i>: <ul><li><b>rgb</b> (default): Imagery is returned in red, green and blue bands. This matches the visible spectrum.</li><li><b>irg</b>: Imagery is returned in infrared, red and green bands. These bands are color-shifted: infrared is displayed as red, red is displayed as green and green is displayed as blue.</li></ul> Allowed: rgb, irg |
| image-format | query | False | string | The file format of the image. All formats have been compressed with jpeg compression of .95.<br><br><i>Available values</i>: <ul><li><b>jpeg</b>: Most performant, no georeferencing or transparency.</li><li><b>png</b>: No georefrencing, supports transparency.</li><li><b>tiff</b>: Least performant, supports georeferencing and transparency.</li><li><b>jpeg/png</b> (default): Either jpeg or png may be returned. Selected automatically based on the presense of transparent pixels in the source image.</li></ul> |

### Responses

- **200**: OK (image/jpeg, image/png, image/tiff)
- **204**: No Content (*/*)
- **400**: Bad Request (*/*)
- **401**: Unauthorized (*/*)
- **403**: Forbidden (*/*)
- **404**: Not Found (*/*)
- **412**: Precondition Failed (*/*)
- **413**: Payload Too Large (*/*)
- **422**: Unprocessable Entity (*/*)
- **429**: Too Many Requests (*/*)
- **500**: Internal Server Error (*/*)
- **503**: Service Unavailable (*/*)

## POST /oriented/tile

**Returns an oriented image tile.**

### Introduction

This service will deliver an oriented tile from a specified image, a tile being a 256x256 pixel portion of the image. Every image is available at full, 1/2, 1/4, and 1/8 of the original resolution, and then they are cut into 256x256 pixel tiles starting with the upper left corner. This service will be useful for creating mapping application integrations with oblique imagery. This service will allow downloading an image tile-by-tile, significantly improving the users's loading time by avoiding the download of non-visible parts of the image according to the user's viewing extent.

<img src="../resources/img/docs/oriented_tile.jpg"/>

### Request body

```json
{
 "content": {
  "application/json": {
   "examples": {
    "Default request": {
     "description": "Default request",
     "value": {
      "image-name": "2025~us-ks-wichita-2025~images~W_20250710_214540_60_2D4E51D083DDD0D_rgb",
      "downsample": 1,
      "tile-x": 13,
      "tile-y": 6,
      "bands": "rgb",
      "image-format": "jpeg"
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
     "bands": {
      "type": "string",
      "default": "rgb",
      "description": "The color bands in which the returned image will be comprised of.<br><br><i>Available values</i>: <ul><li><b>rgb</b> (default): Imagery is returned in red, green and blue bands. This matches the visible spectrum.</li><li><b>irg</b>: Imagery is returned in infrared, red and green bands. These bands are color-shifted: infrared is displayed as red, red is displayed as green and green is displayed as blue.</li></ul>",
      "enum": [
       "all",
       "rgb",
       "irg"
      ]
     },
     "downsample": {
      "type": "integer",
      "format": "int32"
     },
     "image-format": {
      "type": "string",
      "default": "jpeg/png",
      "description": "The file format of the image. All formats have been compressed with jpeg compression of .95.<br><br><i>Available values</i>: <ul><li><b>jpeg</b>: Most performant, no georeferencing or transparency.</li><li><b>png</b>: No georefrencing, supports transparency.</li><li><b>tiff</b>: Least performant, supports georeferencing and transparency.</li><li><b>jpeg/png</b> (default): Either jpeg or png may be returned. Selected automatically based on the presense of transparent pixels in the source image.</li></ul>",
      "enum": [
       "jpeg",
       "png",
       "tiff",
       "jpeg/png",
       "b3dm/glb"
      ]
     },
     "image-name": {
      "type": "string"
     },
     "tile-x": {
      "type": "integer",
      "format": "int32",
      "description": "The x coordinate of the tile. (Datum: WGS84)"
     },
     "tile-y": {
      "type": "integer",
      "format": "int32",
      "description": "The y coordinate of the tile. (Datum: WGS84)"
     }
    }
   }
  },
  "application/xml": {
   "examples": {
    "Default request": {
     "description": "Default request",
     "value": {
      "image-name": "2025~us-ks-wichita-2025~images~W_20250710_214540_60_2D4E51D083DDD0D_rgb",
      "downsample": 1,
      "tile-x": 13,
      "tile-y": 6,
      "bands": "rgb",
      "image-format": "jpeg"
     }
    }
   },
   "schema": {
    "type": "object",
    "properties": {
     "bands": {
      "type": "string",
      "default": "rgb",
      "description": "The color bands in which the returned image will be comprised of.<br><br><i>Available values</i>: <ul><li><b>rgb</b> (default): Imagery is returned in red, green and blue bands. This matches the visible spectrum.</li><li><b>irg</b>: Imagery is returned in infrared, red and green bands. These bands are color-shifted: infrared is displayed as red, red is displayed as green and green is displayed as blue.</li></ul>",
      "enum": [
       "all",
       "rgb",
       "irg"
      ]
     },
     "downsample": {
      "type": "integer",
      "format": "int32"
     },
     "image-format": {
      "type": "string",
      "default": "jpeg/png",
      "description": "The file format of the image. All formats have been compressed with jpeg compression of .95.<br><br><i>Available values</i>: <ul><li><b>jpeg</b>: Most performant, no georeferencing or transparency.</li><li><b>png</b>: No georefrencing, supports transparency.</li><li><b>tiff</b>: Least performant, supports georeferencing and transparency.</li><li><b>jpeg/png</b> (default): Either jpeg or png may be returned. Selected automatically based on the presense of transparent pixels in the source image.</li></ul>",
      "enum": [
       "jpeg",
       "png",
       "tiff",
       "jpeg/png",
       "b3dm/glb"
      ]
     },
     "image-name": {
      "type": "string"
     },
     "tile-x": {
      "type": "integer",
      "format": "int32",
      "description": "The x coordinate of the tile. (Datum: WGS84)"
     },
     "tile-y": {
      "type": "integer",
      "format": "int32",
      "description": "The y coordinate of the tile. (Datum: WGS84)"
     }
    }
   }
  }
 },
 "required": true
}
```

### Responses

- **200**: OK (image/jpeg, image/png, image/tiff)
- **204**: No Content (*/*)
- **400**: Bad Request (*/*)
- **401**: Unauthorized (*/*)
- **403**: Forbidden (*/*)
- **404**: Not Found (*/*)
- **412**: Precondition Failed (*/*)
- **413**: Payload Too Large (*/*)
- **422**: Unprocessable Entity (*/*)
- **429**: Too Many Requests (*/*)
- **500**: Internal Server Error (*/*)
- **503**: Service Unavailable (*/*)
