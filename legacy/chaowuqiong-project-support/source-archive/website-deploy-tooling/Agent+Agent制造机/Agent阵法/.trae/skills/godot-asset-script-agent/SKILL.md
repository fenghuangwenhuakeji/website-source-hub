---
name: "godot-asset-script-agent"
description: "Ultimate procedural asset generation expert for Godot 4.x. Provides complete GDScript/C# code for generating textures, meshes, animations, tilesets, and other game assets programmatically with noise algorithms and procedural generation techniques."
---

# Godot Asset Script Agent - 程序化资源生成专家

## 核心理念

**代码即画笔，算法即艺术。用程序生成无限可能的游戏资源，用数学创造独特的游戏世界。**

Godot Asset Script Agent 是一个专业级程序化资源生成助手，提供完整的GDScript/C#代码，帮助开发者通过代码动态生成纹理、网格、瓦片集、动画等游戏资源，实现无限内容生成和运行时资源创建。

## 核心工作流程

```
需求分析 → 算法选择 → 参数设计 → 代码实现 → 资源生成 → 性能优化 → 集成测试 → 输出
```

## 程序化纹理生成

### 噪声纹理

```gdscript
class_name NoiseTextureGenerator
extends Node

enum NoiseType { PERLIN, SIMPLEX, CELLULAR, VALUE }

@export var width: int = 256
@export var height: int = 256
@export var noise_type: NoiseType = NoiseType.PERLIN
@export var octaves: int = 4
@export var persistence: float = 0.5
@export var lacunarity: float = 2.0

func generate_noise_texture() -> ImageTexture:
    var image = Image.create(width, height, false, Image.FORMAT_RGB8)
    var noise = FastNoiseLite.new()
    
    match noise_type:
        NoiseType.PERLIN:
            noise.noise_type = FastNoiseLite.TYPE_PERLIN
        NoiseType.SIMPLEX:
            noise.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
        NoiseType.CELLULAR:
            noise.noise_type = FastNoiseLite.TYPE_CELLULAR
        NoiseType.VALUE:
            noise.noise_type = FastNoiseLite.TYPE_VALUE
    
    noise.fractal_octaves = octaves
    noise.fractal_gain = persistence
    noise.fractal_lacunarity = lacunarity
    
    for x in range(width):
        for y in range(height):
            var value = (noise.get_noise_2d(x, y) + 1.0) / 2.0
            var color = Color(value, value, value)
            image.set_pixel(x, y, color)
    
    return ImageTexture.create_from_image(image)

func generate_colored_noise(color1: Color, color2: Color) -> ImageTexture:
    var image = Image.create(width, height, false, Image.FORMAT_RGB8)
    var noise = FastNoiseLite.new()
    noise.noise_type = FastNoiseLite.TYPE_PERLIN
    
    for x in range(width):
        for y in range(height):
            var t = (noise.get_noise_2d(x, y) + 1.0) / 2.0
            var color = color1.lerp(color2, t)
            image.set_pixel(x, y, color)
    
    return ImageTexture.create_from_image(image)
```

### 程序化瓦片纹理

```gdscript
class_name ProceduralTileTexture
extends Node

@export var tile_size: int = 32
@export var border_width: int = 2
@export var base_color: Color = Color.GRAY
@export var border_color: Color = Color.DARK_GRAY

func generate_tile_texture() -> ImageTexture:
    var image = Image.create(tile_size, tile_size, false, Image.FORMAT_RGB8)
    
    # 填充底色
    for x in range(tile_size):
        for y in range(tile_size):
            image.set_pixel(x, y, base_color)
    
    # 绘制边框
    for i in range(tile_size):
        # 上边框
        for w in range(border_width):
            image.set_pixel(i, w, border_color)
        # 下边框
        for w in range(border_width):
            image.set_pixel(i, tile_size - 1 - w, border_color)
        # 左边框
        for w in range(border_width):
            image.set_pixel(w, i, border_color)
        # 右边框
        for w in range(border_width):
            image.set_pixel(tile_size - 1 - w, i, border_color)
    
    return ImageTexture.create_from_image(image)

func generate_varied_tiles(count: int) -> Array[ImageTexture]:
    var tiles: Array[ImageTexture] = []
    
    for i in range(count):
        var variation = randf() * 0.2 - 0.1
        var varied_color = base_color.lightened(variation)
        var tile = generate_tile_texture()
        tiles.append(tile)
    
    return tiles
```

## 程序化网格生成

### 基础平面网格

```gdscript
class_name MeshGenerator
extends Node

func create_plane_mesh(size: float = 1.0, subdivisions: int = 1) -> ArrayMesh:
    var vertices = PackedVector3Array()
    var indices = PackedInt32Array()
    var uvs = PackedVector2Array()
    var normals = PackedVector3Array()
    
    var step = size / subdivisions
    var offset = size / 2.0
    
    # 生成顶点
    for z in range(subdivisions + 1):
        for x in range(subdivisions + 1):
            var vx = x * step - offset
            var vz = z * step - offset
            vertices.append(Vector3(vx, 0, vz))
            uvs.append(Vector2(float(x) / subdivisions, float(z) / subdivisions))
            normals.append(Vector3.UP)
    
    # 生成索引
    for z in range(subdivisions):
        for x in range(subdivisions):
            var i = z * (subdivisions + 1) + x
            
            # 第一个三角形
            indices.append(i)
            indices.append(i + subdivisions + 1)
            indices.append(i + 1)
            
            # 第二个三角形
            indices.append(i + 1)
            indices.append(i + subdivisions + 1)
            indices.append(i + subdivisions + 2)
    
    var arrays = []
    arrays.resize(Mesh.ARRAY_MAX)
    arrays[Mesh.ARRAY_VERTEX] = vertices
    arrays[Mesh.ARRAY_INDEX] = indices
    arrays[Mesh.ARRAY_TEX_UV] = uvs
    arrays[Mesh.ARRAY_NORMAL] = normals
    
    var mesh = ArrayMesh.new()
    mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
    return mesh

func create_cube_mesh(size: float = 1.0) -> ArrayMesh:
    var vertices = PackedVector3Array()
    var indices = PackedInt32Array()
    var uvs = PackedVector2Array()
    
    var s = size / 2.0
    
    # 前面
    vertices.append_array([
        Vector3(-s, -s, s), Vector3(s, -s, s), Vector3(s, s, s), Vector3(-s, s, s)
    ])
    # 后面
    vertices.append_array([
        Vector3(s, -s, -s), Vector3(-s, -s, -s), Vector3(-s, s, -s), Vector3(s, s, -s)
    ])
    # 其他面...
    
    var arrays = []
    arrays.resize(Mesh.ARRAY_MAX)
    arrays[Mesh.ARRAY_VERTEX] = vertices
    arrays[Mesh.ARRAY_INDEX] = indices
    arrays[Mesh.ARRAY_TEX_UV] = uvs
    
    var mesh = ArrayMesh.new()
    mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
    return mesh
```

### 地形网格生成

```gdscript
class_name TerrainGenerator
extends Node

@export var width: int = 100
@export var depth: int = 100
@export var height_scale: float = 10.0
@export var noise_scale: float = 0.05

func generate_terrain_mesh() -> ArrayMesh:
    var vertices = PackedVector3Array()
    var indices = PackedInt32Array()
    var uvs = PackedVector2Array()
    var normals = PackedVector3Array()
    
    var noise = FastNoiseLite.new()
    noise.noise_type = FastNoiseLite.TYPE_PERLIN
    
    # 生成顶点
    for z in range(depth + 1):
        for x in range(width + 1):
            var nx = x * noise_scale
            var nz = z * noise_scale
            var height = noise.get_noise_2d(nx, nz) * height_scale
            
            vertices.append(Vector3(x, height, z))
            uvs.append(Vector2(float(x) / width, float(z) / depth))
    
    # 生成索引和法线
    for z in range(depth):
        for x in range(width):
            var i = z * (width + 1) + x
            
            indices.append(i)
            indices.append(i + width + 1)
            indices.append(i + 1)
            
            indices.append(i + 1)
            indices.append(i + width + 1)
            indices.append(i + width + 2)
    
    # 计算法线
    normals = _calculate_normals(vertices, indices)
    
    var arrays = []
    arrays.resize(Mesh.ARRAY_MAX)
    arrays[Mesh.ARRAY_VERTEX] = vertices
    arrays[Mesh.ARRAY_INDEX] = indices
    arrays[Mesh.ARRAY_TEX_UV] = uvs
    arrays[Mesh.ARRAY_NORMAL] = normals
    
    var mesh = ArrayMesh.new()
    mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
    return mesh

func _calculate_normals(vertices: PackedVector3Array, indices: PackedInt32Array) -> PackedVector3Array:
    var normals = PackedVector3Array()
    normals.resize(vertices.size())
    
    for i in range(0, indices.size(), 3):
        var i0 = indices[i]
        var i1 = indices[i + 1]
        var i2 = indices[i + 2]
        
        var v0 = vertices[i0]
        var v1 = vertices[i1]
        var v2 = vertices[i2]
        
        var normal = (v1 - v0).cross(v2 - v0).normalized()
        normals[i0] += normal
        normals[i1] += normal
        normals[i2] += normal
    
    for i in range(normals.size()):
        normals[i] = normals[i].normalized()
    
    return normals
```

## 程序化瓦片集生成

```gdscript
class_name ProceduralTileset
extends Node

@export var tile_size: int = 32
@export var tile_count: int = 16
@export var atlas_size: int = 4

func generate_tileset_atlas() -> ImageTexture:
    var atlas_width = tile_size * atlas_size
    var atlas_height = tile_size * atlas_size
    var image = Image.create(atlas_width, atlas_height, false, Image.FORMAT_RGB8)
    
    for i in range(tile_count):
        var tx = (i % atlas_size) * tile_size
        var ty = (i / atlas_size) * tile_size
        
        var tile_image = _generate_single_tile(i)
        
        for x in range(tile_size):
            for y in range(tile_size):
                image.set_pixel(tx + x, ty + y, tile_image.get_pixel(x, y))
    
    return ImageTexture.create_from_image(image)

func _generate_single_tile(index: int) -> Image:
    var image = Image.create(tile_size, tile_size, false, Image.FORMAT_RGB8)
    
    match index:
        0: # 草地
            _fill_grass(image)
        1: # 土地
            _fill_dirt(image)
        2: # 水
            _fill_water(image)
        3: # 石头
            _fill_stone(image)
        _:
            _fill_random(image)
    
    return image

func _fill_grass(image: Image) -> void:
    var base_color = Color(0.2, 0.6, 0.2)
    for x in range(tile_size):
        for y in range(tile_size):
            var variation = randf() * 0.1 - 0.05
            image.set_pixel(x, y, base_color.lightened(variation))

func _fill_dirt(image: Image) -> void:
    var base_color = Color(0.4, 0.3, 0.2)
    for x in range(tile_size):
        for y in range(tile_size):
            var variation = randf() * 0.1 - 0.05
            image.set_pixel(x, y, base_color.lightened(variation))

func _fill_water(image: Image) -> void:
    var base_color = Color(0.2, 0.4, 0.8)
    for x in range(tile_size):
        for y in range(tile_size):
            var variation = randf() * 0.05 - 0.025
            image.set_pixel(x, y, base_color.lightened(variation))

func _fill_stone(image: Image) -> void:
    var base_color = Color(0.5, 0.5, 0.5)
    for x in range(tile_size):
        for y in range(tile_size):
            var variation = randf() * 0.15 - 0.075
            image.set_pixel(x, y, base_color.lightened(variation))

func _fill_random(image: Image) -> void:
    for x in range(tile_size):
        for y in range(tile_size):
            image.set_pixel(x, y, Color(randf(), randf(), randf()))
```

## 程序化精灵生成

```gdscript
class_name ProceduralSpriteGenerator
extends Node

@export var sprite_size: int = 32
@export var color_palette: Array[Color] = [Color.RED, Color.GREEN, Color.BLUE]

func generate_random_sprite() -> ImageTexture:
    var image = Image.create(sprite_size, sprite_size, false, Image.FORMAT_RGBA8)
    
    for x in range(sprite_size):
        for y in range(sprite_size):
            var color = color_palette[randi() % color_palette.size()]
            # 添加一些随机变化
            if randf() > 0.7:
                color = color.darkened(0.2)
            image.set_pixel(x, y, color)
    
    return ImageTexture.create_from_image(image)

func generate_symmetric_sprite() -> ImageTexture:
    var image = Image.create(sprite_size, sprite_size, false, Image.FORMAT_RGBA8)
    var half_size = sprite_size / 2
    
    # 生成左半边
    for x in range(half_size):
        for y in range(sprite_size):
            var color = color_palette[randi() % color_palette.size()]
            image.set_pixel(x, y, color)
    
    # 镜像到右半边
    for x in range(half_size):
        for y in range(sprite_size):
            var color = image.get_pixel(x, y)
            image.set_pixel(sprite_size - 1 - x, y, color)
    
    return ImageTexture.create_from_image(image)
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要程序化生成游戏资源
- 需要动态创建纹理/网格
- 需要运行时资源生成
- 需要减少资源包大小
- 需要无限内容生成
- 需要噪声生成地形

## 输出保证

- [ ] 代码可直接运行
- [ ] 算法高效优化
- [ ] 参数可调可控
- [ ] 性能开销合理
- [ ] 支持多种生成算法
- [ ] 包含完整示例

---

**记住：程序化生成是效率与创意的完美结合！**
