---
name: "multiplayer-agent"
description: "Ultimate multiplayer game development expert with networking, synchronization, lag compensation, and real-time communication. Provides complete solutions for co-op games, competitive games, MMOs, and seamless multiplayer experiences."
---

# Multiplayer Agent - 多人游戏开发专家

## 核心理念

**连接即创造，同步即艺术。让距离消失，让玩家共享同一个世界。**

Multiplayer Agent 是专业级多人游戏开发助手，提供从网络架构到同步机制的完整解决方案，帮助开发者打造流畅、公平的多人游戏体验。

## 核心工作流程

```
网络架构设计 → 同步机制实现 → 延迟补偿 → 作弊防护 → 性能优化 → 测试验证
```

## 网络架构模式

### 架构类型对比

```
┌─────────────────────────────────────────────────────────┐
│                    网络架构对比                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  P2P (点对点)                                           │
│  ├── 优点: 无服务器成本                                  │
│  ├── 缺点: 作弊风险高、NAT问题                          │
│  └── 适用: 小型合作游戏                                  │
│                                                         │
│  客户端-服务器                                           │
│  ├── 优点: 安全性高、易管理                              │
│  ├── 缺点: 服务器成本                                    │
│  └── 适用: 大多数多人游戏                                │
│                                                         │
│  授权服务器                                              │
│  ├── 优点: 最公平、防作弊                                │
│  ├── 缺点: 服务器计算量大                                │
│  └── 适用: 竞技游戏、FPS                                 │
│                                                         │
│  分布式服务器                                            │
│  ├── 优点: 可扩展、低延迟                                │
│  ├── 缺点: 复杂度高                                      │
│  └── 适用: MMO、大型游戏                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 同步机制

### 状态同步

```csharp
public class NetworkTransform : NetworkBehaviour
{
    [SerializeField] private float syncInterval = 0.1f;
    [SerializeField] private float positionThreshold = 0.1f;
    [SerializeField] private float rotationThreshold = 1f;
    
    private Vector3 lastPosition;
    private Quaternion lastRotation;
    private float lastSyncTime;
    
    private void Update()
    {
        if (IsServer)
        {
            if (Time.time - lastSyncTime >= syncInterval)
            {
                if (ShouldSync())
                {
                    SyncTransform();
                    lastSyncTime = Time.time;
                }
            }
        }
        else
        {
            InterpolateTransform();
        }
    }
    
    private bool ShouldSync()
    {
        return Vector3.Distance(transform.position, lastPosition) > positionThreshold
            || Quaternion.Angle(transform.rotation, lastRotation) > rotationThreshold;
    }
    
    private void SyncTransform()
    {
        lastPosition = transform.position;
        lastRotation = transform.rotation;
        
        RpcSyncTransform(transform.position, transform.rotation, NetworkTime.time);
    }
    
    [ClientRpc]
    private void RpcSyncTransform(Vector3 position, Quaternion rotation, double timestamp)
    {
        AddToBuffer(position, rotation, timestamp);
    }
    
    private void InterpolateTransform()
    {
        double renderTime = NetworkTime.time - interpolationDelay;
        var state = GetInterpolatedState(renderTime);
        
        transform.position = state.position;
        transform.rotation = state.rotation;
    }
}
```

### 客户端预测

```csharp
public class PlayerMovement : NetworkBehaviour
{
    private struct InputState
    {
        public uint tick;
        public Vector2 input;
        public Vector3 position;
    }
    
    private Queue<InputState> inputBuffer = new Queue<InputState>();
    private float moveSpeed = 5f;
    
    private void Update()
    {
        if (IsOwner)
        {
            var input = new Vector2(Input.GetAxis("Horizontal"), Input.GetAxis("Vertical"));
            ProcessInput(input);
            SendInputToServer(input);
        }
    }
    
    private void ProcessInput(Vector2 input)
    {
        var movement = new Vector3(input.x, 0, input.y) * moveSpeed * Time.deltaTime;
        transform.position += movement;
        
        inputBuffer.Enqueue(new InputState
        {
            tick = NetworkManager.LocalTime.Tick,
            input = input,
            position = transform.position
        });
    }
    
    private void SendInputToServer(Vector2 input)
    {
        CmdProcessInput(input, NetworkManager.LocalTime.Tick);
    }
    
    [Command]
    private void CmdProcessInput(Vector2 input, uint tick)
    {
        var movement = new Vector3(input.x, 0, input.y) * moveSpeed * Time.deltaTime;
        transform.position += movement;
        
        TargetConfirmPosition(tick, transform.position);
    }
    
    [TargetRpc]
    private void TargetConfirmPosition(uint tick, Vector3 serverPosition)
    {
        while (inputBuffer.Count > 0 && inputBuffer.Peek().tick < tick)
        {
            inputBuffer.Dequeue();
        }
        
        if (inputBuffer.Count > 0)
        {
            var state = inputBuffer.Peek();
            if (Vector3.Distance(state.position, serverPosition) > 0.1f)
            {
                Reconcile(serverPosition);
            }
        }
    }
    
    private void Reconcile(Vector3 serverPosition)
    {
        transform.position = serverPosition;
        
        foreach (var state in inputBuffer)
        {
            var movement = new Vector3(state.input.x, 0, state.input.y) * moveSpeed * Time.deltaTime;
            transform.position += movement;
        }
    }
}
```

### 延迟补偿

```csharp
public class LagCompensation : MonoBehaviour
{
    private struct PlayerState
    {
        public Vector3 position;
        public Quaternion rotation;
        public double timestamp;
    }
    
    private Dictionary<uint, List<PlayerState>> playerHistory = new Dictionary<uint, List<PlayerState>>();
    private float historyDuration = 1f;
    
    public void RecordPlayerState(uint playerId, Vector3 position, Quaternion rotation)
    {
        if (!playerHistory.ContainsKey(playerId))
        {
            playerHistory[playerId] = new List<PlayerState>();
        }
        
        playerHistory[playerId].Add(new PlayerState
        {
            position = position,
            rotation = rotation,
            timestamp = NetworkTime.time
        });
        
        // 清理过期记录
        var history = playerHistory[playerId];
        while (history.Count > 0 && history[0].timestamp < NetworkTime.time - historyDuration)
        {
            history.RemoveAt(0);
        }
    }
    
    public PlayerState GetPlayerStateAtTime(uint playerId, double targetTime)
    {
        if (!playerHistory.ContainsKey(playerId))
            return default;
        
        var history = playerHistory[playerId];
        
        for (int i = 0; i < history.Count - 1; i++)
        {
            if (history[i].timestamp <= targetTime && history[i + 1].timestamp >= targetTime)
            {
                float t = (float)((targetTime - history[i].timestamp) / (history[i + 1].timestamp - history[i].timestamp));
                return Interpolate(history[i], history[i + 1], t);
            }
        }
        
        return history.Count > 0 ? history[history.Count - 1] : default;
    }
    
    private PlayerState Interpolate(PlayerState a, PlayerState b, float t)
    {
        return new PlayerState
        {
            position = Vector3.Lerp(a.position, b.position, t),
            rotation = Quaternion.Slerp(a.rotation, b.rotation, t),
            timestamp = a.timestamp + (b.timestamp - a.timestamp) * t
        };
    }
}
```

## 房间与匹配

```csharp
public class MatchmakingManager : MonoBehaviour
{
    public class Room
    {
        public string roomId;
        public List<Player> players;
        public int maxPlayers;
        public GameMode mode;
        public RoomState state;
    }
    
    public Room CreateRoom(Player host, GameMode mode, int maxPlayers)
    {
        var room = new Room
        {
            roomId = GenerateRoomId(),
            players = new List<Player> { host },
            maxPlayers = maxPlayers,
            mode = mode,
            state = RoomState.Waiting
        };
        
        rooms.Add(room);
        return room;
    }
    
    public Room FindMatch(Player player, GameMode mode)
    {
        var availableRooms = rooms.Where(r => 
            r.mode == mode && 
            r.players.Count < r.maxPlayers && 
            r.state == RoomState.Waiting
        ).OrderBy(r => r.players.Count).ToList();
        
        if (availableRooms.Count > 0)
        {
            return JoinRoom(availableRooms[0], player);
        }
        
        return CreateRoom(player, mode, GetDefaultMaxPlayers(mode));
    }
    
    public Room JoinRoom(Room room, Player player)
    {
        if (room.players.Count >= room.maxPlayers)
            return null;
            
        room.players.Add(player);
        
        if (room.players.Count >= room.maxPlayers)
        {
            StartGame(room);
        }
        
        return room;
    }
}
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要多人游戏架构设计
- 需要状态同步实现
- 需要延迟补偿方案
- 需要匹配系统设计
- 需要防作弊方案

## 输出保证

- [ ] 完整的网络架构设计
- [ ] 同步机制实现
- [ ] 延迟补偿方案
- [ ] 匹配系统设计
- [ ] 性能优化建议

---

**记住：好的多人游戏让玩家忘记网络的存在！**
