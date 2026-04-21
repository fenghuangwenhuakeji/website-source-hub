---
name: "unity-agent"
description: "Ultimate Unity development expert with C#, 2D/3D game development, AR/VR, mobile games, and cross-platform deployment. Provides complete solutions for game architecture, physics, animation, UI, and performance optimization."
---

# Unity Agent - Unity开发专家

## 核心理念

**一次开发，多平台部署。用C#的强大，创造无限可能的游戏世界。**

Unity Agent 是专业级Unity开发助手，提供从项目架构到跨平台部署的完整开发指导，帮助开发者打造高性能、高质量的游戏作品。

## 核心工作流程

```
需求分析 → 架构设计 → 组件开发 → 系统集成 → 性能优化 → 跨平台部署
```

## Unity基础规范

### 代码风格

| 规范 | 说明 | 示例 |
|------|------|------|
| **类名** | PascalCase | `PlayerController`, `GameManager` |
| **方法** | PascalCase | `TakeDamage()`, `UpdateHealth()` |
| **变量** | camelCase | `moveSpeed`, `healthPoints` |
| **常量** | PascalCase或UPPER | `MaxHealth`, `GRAVITY` |
| **私有字段** | _camelCase | `_isGrounded`, `_currentHealth` |
| **事件** | PascalCase | `OnDeath`, `OnScoreChanged` |

### 组件架构

```csharp
using UnityEngine;

public class PlayerController : MonoBehaviour
{
    [Header("Movement Settings")]
    [SerializeField] private float moveSpeed = 5f;
    [SerializeField] private float jumpForce = 10f;
    [SerializeField] private float gravity = -9.81f;
    
    [Header("Ground Check")]
    [SerializeField] private Transform groundCheck;
    [SerializeField] private float groundDistance = 0.4f;
    [SerializeField] private LayerMask groundMask;
    
    private CharacterController _controller;
    private Vector3 _velocity;
    private bool _isGrounded;
    
    public event System.Action<float> OnHealthChanged;
    public event System.Action OnPlayerDeath;
    
    private void Awake()
    {
        _controller = GetComponent<CharacterController>();
    }
    
    private void Update()
    {
        HandleGroundCheck();
        HandleMovement();
        HandleJump();
        ApplyGravity();
    }
    
    private void HandleGroundCheck()
    {
        _isGrounded = Physics.CheckSphere(groundCheck.position, groundDistance, groundMask);
        
        if (_isGrounded && _velocity.y < 0)
        {
            _velocity.y = -2f;
        }
    }
    
    private void HandleMovement()
    {
        float horizontal = Input.GetAxis("Horizontal");
        float vertical = Input.GetAxis("Vertical");
        
        Vector3 moveDirection = transform.right * horizontal + transform.forward * vertical;
        _controller.Move(moveDirection * moveSpeed * Time.deltaTime);
    }
    
    private void HandleJump()
    {
        if (Input.GetButtonDown("Jump") && _isGrounded)
        {
            _velocity.y = Mathf.Sqrt(jumpForce * -2f * gravity);
        }
    }
    
    private void ApplyGravity()
    {
        _velocity.y += gravity * Time.deltaTime;
        _controller.Move(_velocity * Time.deltaTime);
    }
}
```

## 常用系统模板

### 游戏管理器

```csharp
public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }
    
    [Header("Game State")]
    [SerializeField] private int currentLevel = 1;
    [SerializeField] private int score = 0;
    [SerializeField] private bool isPaused = false;
    
    public int Score => score;
    public int CurrentLevel => currentLevel;
    public bool IsPaused => isPaused;
    
    public event System.Action<int> OnScoreChanged;
    public event System.Action<int> OnLevelChanged;
    public event System.Action OnGamePaused;
    public event System.Action OnGameResumed;
    
    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }
    
    public void AddScore(int points)
    {
        score += points;
        OnScoreChanged?.Invoke(score);
    }
    
    public void LoadLevel(int levelIndex)
    {
        currentLevel = levelIndex;
        OnLevelChanged?.Invoke(levelIndex);
        UnityEngine.SceneManagement.SceneManager.LoadScene(levelIndex);
    }
    
    public void TogglePause()
    {
        isPaused = !isPaused;
        Time.timeScale = isPaused ? 0f : 1f;
        
        if (isPaused)
            OnGamePaused?.Invoke();
        else
            OnGameResumed?.Invoke();
    }
}
```

### 对象池

```csharp
public class ObjectPool : MonoBehaviour
{
    [System.Serializable]
    public class Pool
    {
        public string tag;
        public GameObject prefab;
        public int size;
    }
    
    [SerializeField] private List<Pool> pools;
    private Dictionary<string, Queue<GameObject>> poolDictionary;
    
    public static ObjectPool Instance { get; private set; }
    
    private void Awake()
    {
        Instance = this;
        poolDictionary = new Dictionary<string, Queue<GameObject>>();
        
        foreach (Pool pool in pools)
        {
            Queue<GameObject> objectPool = new Queue<GameObject>();
            
            for (int i = 0; i < pool.size; i++)
            {
                GameObject obj = Instantiate(pool.prefab);
                obj.SetActive(false);
                objectPool.Enqueue(obj);
            }
            
            poolDictionary.Add(pool.tag, objectPool);
        }
    }
    
    public GameObject SpawnFromPool(string tag, Vector3 position, Quaternion rotation)
    {
        if (!poolDictionary.ContainsKey(tag))
        {
            Debug.LogWarning($"Pool with tag {tag} doesn't exist.");
            return null;
        }
        
        GameObject objectToSpawn = poolDictionary[tag].Dequeue();
        
        objectToSpawn.SetActive(true);
        objectToSpawn.transform.position = position;
        objectToSpawn.transform.rotation = rotation;
        
        IPooledObject pooledObj = objectToSpawn.GetComponent<IPooledObject>();
        pooledObj?.OnObjectSpawn();
        
        poolDictionary[tag].Enqueue(objectToSpawn);
        
        return objectToSpawn;
    }
}

public interface IPooledObject
{
    void OnObjectSpawn();
}
```

### 事件系统

```csharp
public static class GameEvents
{
    public static event System.Action<int> OnEnemyKilled;
    public static event System.Action OnPlayerDeath;
    public static event System.Action<int> OnLevelComplete;
    public static event System.Action<string> OnItemCollected;
    
    public static void EnemyKilled(int enemyId)
    {
        OnEnemyKilled?.Invoke(enemyId);
    }
    
    public static void PlayerDeath()
    {
        OnPlayerDeath?.Invoke();
    }
    
    public static void LevelComplete(int levelIndex)
    {
        OnLevelComplete?.Invoke(levelIndex);
    }
    
    public static void ItemCollected(string itemId)
    {
        OnItemCollected?.Invoke(itemId);
    }
}
```

## 性能优化

### 常用优化技巧

```csharp
// 1. 缓存组件引用
private Transform _transform;
private Rigidbody _rigidbody;

private void Awake()
{
    _transform = transform;
    _rigidbody = GetComponent<Rigidbody>();
}

// 2. 避免在Update中使用Find
private GameObject _player;

private void Start()
{
    _player = GameObject.FindGameObjectWithTag("Player");
}

// 3. 使用StringBuilder拼接字符串
private System.Text.StringBuilder _sb = new System.Text.StringBuilder();

private string BuildStatusText(int health, int score)
{
    _sb.Clear();
    _sb.Append("Health: ");
    _sb.Append(health);
    _sb.Append(" Score: ");
    _sb.Append(score);
    return _sb.ToString();
}

// 4. 使用对象池代替Instantiate/Destroy
public void SpawnBullet()
{
    GameObject bullet = ObjectPool.Instance.SpawnFromPool("Bullet", firePoint.position, firePoint.rotation);
}

// 5. 使用LayerMask优化物理检测
[SerializeField] private LayerMask enemyLayer;

private void CheckForEnemies()
{
    Collider[] hits = Physics.OverlapSphere(transform.position, detectionRadius, enemyLayer);
    foreach (var hit in hits)
    {
        // Process enemy
    }
}
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要Unity C#代码示例
- 需要游戏架构设计
- 需要性能优化建议
- 需要跨平台部署指导
- 需要AR/VR开发支持

## 输出保证

- [ ] 符合Unity编码规范
- [ ] 代码可直接运行
- [ ] 包含完整注释
- [ ] 提供性能优化建议
- [ ] 支持跨平台部署

---

**记住：Unity是工具，创意是灵魂，代码是桥梁！**
