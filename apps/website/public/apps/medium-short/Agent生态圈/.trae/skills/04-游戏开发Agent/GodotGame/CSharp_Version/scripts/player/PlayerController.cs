using Godot;
using System;

namespace GodotGame
{
    /// <summary>
    /// Player Controller - C# Version
    /// Handles player movement, combat, and interactions
    /// </summary>
    [GlobalClass]
    public partial class PlayerController : CharacterBody2D
    {
        // Signals
        [Signal]
        public delegate void HealthChangedEventHandler(int newHealth, int maxHealth);
        
        [Signal]
        public delegate void PlayerDiedEventHandler();
        
        [Signal]
        public delegate void PlayerRespawnedEventHandler();

        // Movement Constants
        private const float Speed = 150.0f;
        private const float JumpVelocity = -350.0f;
        private const float Acceleration = 800.0f;
        private const float Friction = 1000.0f;
        private const float AirAcceleration = 400.0f;
        private const float AirFriction = 200.0f;
        private const float CoyoteTime = 0.1f;
        private const float JumpBuffer = 0.1f;

        // Combat Constants
        private const float AttackCooldown = 0.3f;
        private const float InvincibilityTime = 1.0f;

        // Player Stats
        [Export]
        public int MaxHealth { get; set; } = 100;
        
        private int _currentHealth;
        public int CurrentHealth
        {
            get => _currentHealth;
            set
            {
                _currentHealth = Mathf.Clamp(value, 0, MaxHealth);
                EmitSignal(SignalName.HealthChanged, _currentHealth, MaxHealth);
                if (_currentHealth <= 0)
                {
                    Die();
                }
            }
        }

        [Export]
        public int AttackDamage { get; set; } = 25;
        
        [Export]
        public float MoveSpeedMultiplier { get; set; } = 1.0f;

        // State Variables
        private bool _isGrounded = false;
        private bool _isAttacking = false;
        private bool _isInvincible = false;
        private bool _canJump = false;
        private bool _facingRight = true;

        // Timers
        private float _coyoteTimer = 0.0f;
        private float _jumpBufferTimer = 0.0f;
        private float _attackTimer = 0.0f;
        private float _invincibilityTimer = 0.0f;

        // Node References
        private AnimatedSprite2D _sprite;
        private CollisionShape2D _collisionShape;
        private Area2D _attackHitbox;
        private RayCast2D _groundCheck;

        public override void _Ready()
        {
            _currentHealth = MaxHealth;
            
            _sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
            _collisionShape = GetNode<CollisionShape2D>("CollisionShape2D");
            _attackHitbox = GetNode<Area2D>("AttackHitbox");
            _groundCheck = GetNode<RayCast2D>("GroundCheck");

            if (_attackHitbox != null)
            {
                _attackHitbox.Monitoring = false;
                _attackHitbox.BodyEntered += OnAttackHitboxBodyEntered;
            }

            GD.Print("PlayerController initialized");
        }

        public override void _PhysicsProcess(double delta)
        {
            if (GameManager.Instance.CurrentState != GameManager.GameState.Playing)
                return;

            HandleTimers((float)delta);
            HandleInput();
            ApplyMovement((float)delta);
            HandleAnimations();

            MoveAndSlide();
        }

        private void HandleTimers(float delta)
        {
            // Coyote time
            if (IsOnFloor())
            {
                _coyoteTimer = CoyoteTime;
                _canJump = true;
            }
            else
            {
                _coyoteTimer -= delta;
                if (_coyoteTimer <= 0)
                    _canJump = false;
            }

            // Jump buffer
            if (_jumpBufferTimer > 0)
                _jumpBufferTimer -= delta;

            // Attack cooldown
            if (_attackTimer > 0)
            {
                _attackTimer -= delta;
                if (_attackTimer <= 0)
                {
                    _isAttacking = false;
                    if (_attackHitbox != null)
                        _attackHitbox.Monitoring = false;
                }
            }

            // Invincibility
            if (_invincibilityTimer > 0)
            {
                _invincibilityTimer -= delta;
                if (_invincibilityTimer <= 0)
                {
                    _isInvincible = false;
                    if (_sprite != null)
                        _sprite.Modulate = new Color(1, 1, 1, 1);
                }
            }
        }

        private void HandleInput()
        {
            // Jump input
            if (Input.IsActionJustPressed("jump"))
            {
                _jumpBufferTimer = JumpBuffer;
            }

            // Attack input
            if (Input.IsActionJustPressed("attack") && _attackTimer <= 0)
            {
                Attack();
            }

            // Update facing direction
            float direction = Input.GetAxis("move_left", "move_right");
            if (direction != 0)
            {
                _facingRight = direction > 0;
                UpdateFacing();
            }
        }

        private void ApplyMovement(float delta)
        {
            float direction = Input.GetAxis("move_left", "move_right");

            // Handle jump
            if (_jumpBufferTimer > 0 && _canJump)
            {
                Velocity = new Vector2(Velocity.X, JumpVelocity);
                _jumpBufferTimer = 0;
                _coyoteTimer = 0;
                _canJump = false;
                AudioManager.Instance?.PlaySfx("jump");
            }

            // Apply gravity
            if (!IsOnFloor())
            {
                Velocity += GetGravity() * delta;
            }

            // Apply horizontal movement
            float targetSpeed = direction * Speed * MoveSpeedMultiplier;

            if (IsOnFloor())
            {
                // Ground movement
                if (direction != 0)
                {
                    Velocity = new Vector2(
                        Mathf.MoveToward(Velocity.X, targetSpeed, Acceleration * delta),
                        Velocity.Y
                    );
                }
                else
                {
                    Velocity = new Vector2(
                        Mathf.MoveToward(Velocity.X, 0, Friction * delta),
                        Velocity.Y
                    );
                }
            }
            else
            {
                // Air movement
                if (direction != 0)
                {
                    Velocity = new Vector2(
                        Mathf.MoveToward(Velocity.X, targetSpeed, AirAcceleration * delta),
                        Velocity.Y
                    );
                }
                else
                {
                    Velocity = new Vector2(
                        Mathf.MoveToward(Velocity.X, 0, AirFriction * delta),
                        Velocity.Y
                    );
                }
            }
        }

        private void HandleAnimations()
        {
            if (_sprite == null)
                return;

            if (_isAttacking)
            {
                _sprite.Play("attack");
            }
            else if (!IsOnFloor())
            {
                if (Velocity.Y < 0)
                    _sprite.Play("jump");
                else
                    _sprite.Play("fall");
            }
            else if (Mathf.Abs(Velocity.X) > 10)
            {
                _sprite.Play("run");
            }
            else
            {
                _sprite.Play("idle");
            }
        }

        private void UpdateFacing()
        {
            if (_sprite != null)
                _sprite.FlipH = !_facingRight;

            // Update attack hitbox position
            if (_attackHitbox != null)
            {
                float hitboxOffset = _facingRight ? 20.0f : -20.0f;
                _attackHitbox.Position = new Vector2(hitboxOffset, _attackHitbox.Position.Y);
            }
        }

        private void Attack()
        {
            _isAttacking = true;
            _attackTimer = AttackCooldown;
            if (_attackHitbox != null)
                _attackHitbox.Monitoring = true;
            
            AudioManager.Instance?.PlaySfx("attack");
        }

        private void OnAttackHitboxBodyEntered(Node2D body)
        {
            if (body.HasMethod("TakeDamage") && body != this)
            {
                body.Call("TakeDamage", AttackDamage);
            }
        }

        public void TakeDamage(int damage)
        {
            if (_isInvincible || GameManager.Instance.CurrentState != GameManager.GameState.Playing)
                return;

            CurrentHealth -= damage;
            _isInvincible = true;
            _invincibilityTimer = InvincibilityTime;

            FlashInvincibility();
            
            AudioManager.Instance?.PlaySfx("hit");
            SceneTransition.Instance?.ShakeScreen(5.0f, 0.3f);
        }

        private async void FlashInvincibility()
        {
            if (_sprite == null)
                return;

            for (int i = 0; i < 5; i++)
            {
                _sprite.Modulate = new Color(1, 1, 1, 0.3f);
                await ToSignal(GetTree().CreateTimer(0.1f), SceneTreeTimer.SignalName.Timeout);
                _sprite.Modulate = new Color(1, 1, 1, 1.0f);
                await ToSignal(GetTree().CreateTimer(0.1f), SceneTreeTimer.SignalName.Timeout);
            }
        }

        public void Heal(int amount)
        {
            CurrentHealth += amount;
            AudioManager.Instance?.PlaySfx("powerup");
        }

        private void Die()
        {
            EmitSignal(SignalName.PlayerDied);
            AudioManager.Instance?.PlaySfx("explosion");
            GameManager.Instance.LoseLife();

            if (GameManager.Instance.Lives > 0)
            {
                Respawn();
            }
            else
            {
                GameManager.Instance.ChangeState(GameManager.GameState.GameOver);
            }
        }

        private void Respawn()
        {
            CurrentHealth = MaxHealth;
            Velocity = Vector2.Zero;
            _isInvincible = true;
            _invincibilityTimer = InvincibilityTime;

            // Reset position
            GlobalPosition = new Vector2(100, 100);

            EmitSignal(SignalName.PlayerRespawned);
            AudioManager.Instance?.PlaySfx("powerup");
        }

        // Power-ups and pickups
        public void CollectCoin(int value = 10)
        {
            GameManager.Instance.AddScore(value);
            AudioManager.Instance?.PlaySfx("coin");
        }

        public void CollectPowerup(string powerupType)
        {
            switch (powerupType)
            {
                case "health":
                    Heal(25);
                    break;
                case "speed":
                    ApplySpeedBoost();
                    break;
                case "damage":
                    ApplyDamageBoost();
                    break;
            }
            AudioManager.Instance?.PlaySfx("powerup");
        }

        private async void ApplySpeedBoost()
        {
            MoveSpeedMultiplier = 1.5f;
            await ToSignal(GetTree().CreateTimer(10.0f), SceneTreeTimer.SignalName.Timeout);
            MoveSpeedMultiplier = 1.0f;
        }

        private async void ApplyDamageBoost()
        {
            int originalDamage = AttackDamage;
            AttackDamage = (int)(AttackDamage * 1.5);
            await ToSignal(GetTree().CreateTimer(10.0f), SceneTreeTimer.SignalName.Timeout);
            AttackDamage = originalDamage;
        }
    }
}
