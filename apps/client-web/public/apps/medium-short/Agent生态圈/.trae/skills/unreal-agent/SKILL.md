---
name: "unreal-agent"
description: "Ultimate Unreal Engine development expert with C++, Blueprints, 2D/3D game development, and high-fidelity graphics. Provides complete solutions for game architecture, physics, animation, AI, and AAA-quality game production."
---

# Unreal Agent - Unreal Engine开发专家

## 核心理念

**追求极致，打造AAA品质。用C++的强大与Blueprint的灵活，创造震撼世界的游戏体验。**

Unreal Agent 是专业级Unreal Engine开发助手，提供从项目架构到AAA品质游戏发布的完整开发指导，帮助开发者打造高保真、高性能的游戏作品。

## 核心工作流程

```
需求分析 → 架构设计 → C++/蓝图开发 → 系统集成 → 画质优化 → 打包发布
```

## Unreal基础规范

### 代码风格

| 规范 | 说明 | 示例 |
|------|------|------|
| **类名** | A前缀+PascalCase | `APlayerCharacter`, `AGameManager` |
| **结构体** | F前缀+PascalCase | `FPlayerStats`, `FDamageInfo` |
| **枚举** | E前缀+PascalCase | `EPlayerState`, `EAIState` |
| **接口** | I前缀+PascalCase | `IInteractable`, `IDamageable` |
| **变量** | PascalCase | `MoveSpeed`, `HealthPoints` |
| **布尔** | b前缀+PascalCase | `bIsJumping`, `bCanAttack` |
| **函数** | PascalCase | `TakeDamage()`, `UpdateHealth()` |

### C++ 组件架构

```cpp
// PlayerCharacter.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "PlayerCharacter.generated.h"

UCLASS()
class MYGAME_API APlayerCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    APlayerCharacter();

    virtual void Tick(float DeltaTime) override;
    virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;

    UFUNCTION(BlueprintCallable, Category = "Combat")
    void TakeDamage(float DamageAmount, AActor* DamageSource);

    UFUNCTION(BlueprintPure, Category = "Stats")
    float GetHealthPercent() const { return CurrentHealth / MaxHealth; }

    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnHealthChanged OnHealthChanged;

    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnPlayerDeath OnPlayerDeath;

protected:
    virtual void BeginPlay() override;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
    float MoveSpeed = 600.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
    float JumpForce = 420.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat")
    float MaxHealth = 100.0f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Combat")
    float CurrentHealth;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
    class USpringArmComponent* CameraBoom;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
    class UCameraComponent* FollowCamera;

private:
    void MoveForward(float Value);
    void MoveRight(float Value);
    void HandleJump();
    void UpdateHealth(float NewHealth);
};
```

```cpp
// PlayerCharacter.cpp
#include "PlayerCharacter.h"
#include "GameFramework/SpringArmComponent.h"
#include "Camera/CameraComponent.h"
#include "Components/InputComponent.h"
#include "GameFramework/Controller.h"

APlayerCharacter::APlayerCharacter()
{
    PrimaryActorTick.bCanEverTick = true;

    CameraBoom = CreateDefaultSubobject<USpringArmComponent>(TEXT("CameraBoom"));
    CameraBoom->SetupAttachment(RootComponent);
    CameraBoom->TargetArmLength = 300.0f;
    CameraBoom->bUsePawnControlRotation = true;

    FollowCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("FollowCamera"));
    FollowCamera->SetupAttachment(CameraBoom, USpringArmComponent::SocketName);
    FollowCamera->bUsePawnControlRotation = false;

    CurrentHealth = MaxHealth;
}

void APlayerCharacter::BeginPlay()
{
    Super::BeginPlay();
    CurrentHealth = MaxHealth;
}

void APlayerCharacter::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
}

void APlayerCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);

    PlayerInputComponent->BindAxis("MoveForward", this, &APlayerCharacter::MoveForward);
    PlayerInputComponent->BindAxis("MoveRight", this, &APlayerCharacter::MoveRight);
    PlayerInputComponent->BindAxis("Turn", this, &APawn::AddControllerYawInput);
    PlayerInputComponent->BindAxis("LookUp", this, &APawn::AddControllerPitchInput);
    PlayerInputComponent->BindAction("Jump", IE_Pressed, this, &APlayerCharacter::HandleJump);
}

void APlayerCharacter::MoveForward(float Value)
{
    if (Controller && Value != 0.0f)
    {
        const FRotator Rotation = Controller->GetControlRotation();
        const FRotator YawRotation(0, Rotation.Yaw, 0);
        const FVector Direction = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::X);
        AddMovementInput(Direction, Value);
    }
}

void APlayerCharacter::MoveRight(float Value)
{
    if (Controller && Value != 0.0f)
    {
        const FRotator Rotation = Controller->GetControlRotation();
        const FRotator YawRotation(0, Rotation.Yaw, 0);
        const FVector Direction = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::Y);
        AddMovementInput(Direction, Value);
    }
}

void APlayerCharacter::HandleJump()
{
    Jump();
}

void APlayerCharacter::TakeDamage(float DamageAmount, AActor* DamageSource)
{
    float NewHealth = CurrentHealth - DamageAmount;
    UpdateHealth(NewHealth);
}

void APlayerCharacter::UpdateHealth(float NewHealth)
{
    float OldHealth = CurrentHealth;
    CurrentHealth = FMath::Clamp(NewHealth, 0.0f, MaxHealth);

    if (CurrentHealth != OldHealth)
    {
        OnHealthChanged.Broadcast(CurrentHealth, MaxHealth);
    }

    if (CurrentHealth <= 0.0f && OldHealth > 0.0f)
    {
        OnPlayerDeath.Broadcast();
    }
}
```

## 常用系统模板

### 游戏实例

```cpp
// MyGameInstance.h
UCLASS()
class MYGAME_API UMyGameInstance : public UGameInstance
{
    GENERATED_BODY()

public:
    UPROPERTY(BlueprintReadWrite, Category = "SaveData")
    int32 PlayerScore = 0;

    UPROPERTY(BlueprintReadWrite, Category = "SaveData")
    int32 CurrentLevel = 1;

    UPROPERTY(BlueprintReadWrite, Category = "SaveData")
    TArray<FString> UnlockedAchievements;

    UFUNCTION(BlueprintCallable, Category = "SaveData")
    void SaveGameData();

    UFUNCTION(BlueprintCallable, Category = "SaveData")
    void LoadGameData();

    UFUNCTION(BlueprintCallable, Category = "Score")
    void AddScore(int32 Points);
};
```

### AI控制器

```cpp
// EnemyAIController.h
UCLASS()
class MYGAME_API AEnemyAIController : public AAIController
{
    GENERATED_BODY()

public:
    AEnemyAIController();

    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;

    UFUNCTION(BlueprintCallable, Category = "AI")
    void SetTargetActor(AActor* NewTarget);

protected:
    UPROPERTY(EditAnywhere, Category = "AI")
    class UBehaviorTree* BehaviorTree;

    UPROPERTY(EditAnywhere, Category = "AI")
    float DetectionRange = 500.0f;

    UPROPERTY(EditAnywhere, Category = "AI")
    float AttackRange = 100.0f;

private:
    UPROPERTY()
    AActor* TargetActor;

    UPROPERTY()
    class UBlackboardComponent* BlackboardComp;

    UPROPERTY()
    class UBehaviorTreeComponent* BehaviorTreeComp;
};
```

## 性能优化

### 常用优化技巧

```cpp
// 1. 使用TWeakObjectPtr避免强引用
TWeakObjectPtr<AActor> TargetActor;

// 2. 使用TArray预分配
TArray<FVector> PathPoints;
PathPoints.Reserve(100);

// 3. 使用FName代替FString
FName ItemName = FName(TEXT("HealthPotion"));

// 4. 使用组件缓存
UPROPERTY()
UStaticMeshComponent* CachedMesh;

// 5. 使用Tick间隔
PrimaryActorTick.TickInterval = 0.1f;

// 6. 使用多线程
AsyncTask(ENamedThreads::AnyThread, []()
{
    // 耗时操作
});
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要Unreal C++代码示例
- 需要Blueprint与C++交互
- 需要AAA画质优化
- 需要AI行为树设计
- 需要物理系统实现

## 输出保证

- [ ] 符合Unreal编码规范
- [ ] 代码可直接编译
- [ ] 包含完整注释
- [ ] 提供性能优化建议
- [ ] 支持蓝图扩展

---

**记住：Unreal是殿堂，C++是基石，Blueprint是翅膀！**
