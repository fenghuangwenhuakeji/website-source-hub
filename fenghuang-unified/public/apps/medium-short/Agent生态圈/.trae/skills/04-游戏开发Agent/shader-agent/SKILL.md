---
name: "shader-agent"
description: "Ultimate shader development expert with HLSL, GLSL, Shader Graph, and visual effects. Provides complete solutions for surface shaders, post-processing, procedural materials, and GPU optimization."
---

# Shader Agent - 着色器开发专家

## 核心理念

**光影即艺术，代码即画笔。用数学的美，渲染世界的真实与幻想。**

Shader Agent 是专业级着色器开发助手，提供从基础材质到高级特效的完整着色器解决方案，帮助开发者打造震撼视觉的游戏画面。

## 核心工作流程

```
效果构思 → 数学建模 → 着色器编写 → 性能优化 → 平台适配 → 效果验证
```

## 着色器基础

### 着色器类型

| 类型 | 用途 | 性能 |
|------|------|------|
| **Surface Shader** | 材质表面效果 | 中等 |
| **Vertex Shader** | 顶点变换 | 高 |
| **Fragment Shader** | 像素计算 | 低 |
| **Compute Shader** | 通用计算 | 高 |
| **Geometry Shader** | 几何生成 | 低 |

### HLSL基础模板

```hlsl
// 基础表面着色器
Shader "Custom/BasicSurface"
{
    Properties
    {
        _MainTex ("Albedo (RGB)", 2D) = "white" {}
        _Glossiness ("Smoothness", Range(0,1)) = 0.5
        _Metallic ("Metallic", Range(0,1)) = 0.0
        _Color ("Color", Color) = (1,1,1,1)
    }
    
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 200
        
        CGPROGRAM
        #pragma surface surf Standard fullforwardshadows
        #pragma target 3.0
        
        sampler2D _MainTex;
        half _Glossiness;
        half _Metallic;
        fixed4 _Color;
        
        struct Input
        {
            float2 uv_MainTex;
        };
        
        void surf (Input IN, inout SurfaceOutputStandard o)
        {
            fixed4 c = tex2D(_MainTex, IN.uv_MainTex) * _Color;
            o.Albedo = c.rgb;
            o.Metallic = _Metallic;
            o.Smoothness = _Glossiness;
            o.Alpha = c.a;
        }
        ENDCG
    }
    FallBack "Diffuse"
}
```

## 常用着色器效果

### 水面着色器

```hlsl
Shader "Custom/Water"
{
    Properties
    {
        _MainTex ("Water Texture", 2D) = "white" {}
        _NormalMap ("Normal Map", 2D) = "bump" {}
        _WaveSpeed ("Wave Speed", float) = 1.0
        _WaveHeight ("Wave Height", float) = 0.1
        _DeepColor ("Deep Color", Color) = (0,0.2,0.4,1)
        _ShallowColor ("Shallow Color", Color) = (0.2,0.5,0.6,1)
        _FresnelPower ("Fresnel Power", float) = 2.0
    }
    
    SubShader
    {
        Tags { "RenderType"="Transparent" "Queue"="Transparent" }
        
        CGPROGRAM
        #pragma surface surf Standard alpha
        
        sampler2D _MainTex;
        sampler2D _NormalMap;
        float _WaveSpeed;
        float _WaveHeight;
        float4 _DeepColor;
        float4 _ShallowColor;
        float _FresnelPower;
        
        struct Input
        {
            float2 uv_MainTex;
            float3 viewDir;
            float3 worldPos;
        };
        
        void surf (Input IN, inout SurfaceOutputStandard o)
        {
            float2 uv = IN.uv_MainTex + _Time.y * _WaveSpeed * 0.1;
            
            float3 normal1 = UnpackNormal(tex2D(_NormalMap, uv));
            float3 normal2 = UnpackNormal(tex2D(_NormalMap, uv * 0.5 + _Time.y * 0.05));
            float3 combinedNormal = normalize(normal1 + normal2);
            
            o.Normal = combinedNormal;
            
            float fresnel = pow(1.0 - saturate(dot(normalize(IN.viewDir), combinedNormal)), _FresnelPower);
            
            float4 waterColor = lerp(_ShallowColor, _DeepColor, fresnel);
            o.Albedo = waterColor.rgb;
            o.Alpha = 0.7 + fresnel * 0.3;
            o.Smoothness = 0.9;
        }
        ENDCG
    }
}
```

### 全息着色器

```hlsl
Shader "Custom/Hologram"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _HologramColor ("Hologram Color", Color) = (0,1,1,1)
        _ScanLineSpeed ("Scan Line Speed", float) = 1.0
        _ScanLineDensity ("Scan Line Density", float) = 50.0
        _GlitchIntensity ("Glitch Intensity", float) = 0.1
    }
    
    SubShader
    {
        Tags { "RenderType"="Transparent" "Queue"="Transparent" }
        
        Pass
        {
            Blend SrcAlpha One
            ZWrite Off
            
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            
            sampler2D _MainTex;
            float4 _HologramColor;
            float _ScanLineSpeed;
            float _ScanLineDensity;
            float _GlitchIntensity;
            
            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
            };
            
            struct v2f
            {
                float2 uv : TEXCOORD0;
                float4 vertex : SV_POSITION;
                float3 worldPos : TEXCOORD1;
            };
            
            v2f vert (appdata v)
            {
                v2f o;
                
                float glitch = sin(_Time.y * 10.0 + v.vertex.y * 5.0) * _GlitchIntensity;
                v.vertex.x += glitch * step(0.99, sin(_Time.y * 50.0));
                
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = v.uv;
                o.worldPos = mul(unity_ObjectToWorld, v.vertex).xyz;
                return o;
            }
            
            fixed4 frag (v2f i) : SV_Target
            {
                float scanLine = sin(i.worldPos.y * _ScanLineDensity + _Time.y * _ScanLineSpeed);
                scanLine = scanLine * 0.5 + 0.5;
                
                fixed4 col = tex2D(_MainTex, i.uv) * _HologramColor;
                col.a *= scanLine * 0.5 + 0.5;
                
                float flicker = sin(_Time.y * 30.0) * 0.1 + 0.9;
                col *= flicker;
                
                return col;
            }
            ENDCG
        }
    }
}
```

### 溶解着色器

```hlsl
Shader "Custom/Dissolve"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _DissolveTex ("Dissolve Texture", 2D) = "white" {}
        _DissolveAmount ("Dissolve Amount", Range(0,1)) = 0.0
        _EdgeColor ("Edge Color", Color) = (1,0.5,0,1)
        _EdgeWidth ("Edge Width", Range(0,0.5)) = 0.1
    }
    
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        
        CGPROGRAM
        #pragma surface surf Standard
        
        sampler2D _MainTex;
        sampler2D _DissolveTex;
        float _DissolveAmount;
        float4 _EdgeColor;
        float _EdgeWidth;
        
        struct Input
        {
            float2 uv_MainTex;
        };
        
        void surf (Input IN, inout SurfaceOutputStandard o)
        {
            fixed4 col = tex2D(_MainTex, IN.uv_MainTex);
            float dissolve = tex2D(_DissolveTex, IN.uv_MainTex).r;
            
            clip(dissolve - _DissolveAmount);
            
            float edge = smoothstep(_DissolveAmount, _DissolveAmount + _EdgeWidth, dissolve);
            
            o.Albedo = lerp(_EdgeColor.rgb, col.rgb, edge);
            o.Alpha = col.a;
        }
        ENDCG
    }
}
```

## 性能优化

### 优化技巧

```hlsl
// 1. 避免分支
// 错误
if (condition)
    color = color1;
else
    color = color2;

// 正确
color = lerp(color2, color1, condition);

// 2. 使用内置函数
float distance = length(a - b);  // 比 sqrt(dot(a-b, a-b)) 更快

// 3. 减少纹理采样
fixed4 col = tex2D(_MainTex, uv);
float mask = col.a;  // 复用alpha通道

// 4. 使用低精度
half3 color = half3(1, 0, 0);  // 移动端优化
fixed alpha = fixed(0.5);       // 11位精度

// 5. 避免重复计算
float2 uv2 = uv * 2.0 - 1.0;  // 一次计算
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要自定义着色器开发
- 需要特效材质实现
- 需要后处理效果
- 需要着色器性能优化
- 需要跨平台着色器适配

## 输出保证

- [ ] 完整的着色器代码
- [ ] 数学原理解释
- [ ] 性能优化建议
- [ ] 平台兼容性说明
- [ ] 参数调节指南

---

**记住：着色器是游戏画面的灵魂！**
