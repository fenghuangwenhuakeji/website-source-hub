using Godot;
using System;

namespace GodotGame
{
    /// <summary>
    /// Scene Transition Manager - Autoload Singleton
    /// Handles smooth scene transitions with fade effects
    /// </summary>
    public partial class SceneTransition : CanvasLayer
    {
        private ColorRect _fadeRect;
        private AnimationPlayer _animationPlayer;

        private const float FadeDuration = 0.5f;

        // Singleton instance
        public static SceneTransition Instance { get; private set; }

        public override void _Ready()
        {
            Instance = this;
            Layer = 100; // Ensure it's on top of everything
            
            SetupUi();
            SetupAnimations();
            
            GD.Print("SceneTransition initialized");
        }

        private void SetupUi()
        {
            // Create fade rectangle
            _fadeRect = new ColorRect
            {
                Color = Colors.Black,
                Visible = false
            };
            
            AddChild(_fadeRect);
            
            // Make it fill the screen
            _fadeRect.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        }

        private void SetupAnimations()
        {
            _animationPlayer = new AnimationPlayer();
            AddChild(_animationPlayer);

            // Create fade animation library
            var animLibrary = new AnimationLibrary();

            // Fade out animation (to black)
            var fadeOut = new Animation
            {
                Length = FadeDuration
            };
            int trackIdx = fadeOut.AddTrack(Animation.TrackType.Value);
            fadeOut.TrackSetPath(trackIdx, "fade_rect:modulate:a");
            fadeOut.TrackInsertKey(trackIdx, 0.0f, 0.0f);
            fadeOut.TrackInsertKey(trackIdx, FadeDuration, 1.0f);
            animLibrary.AddAnimation("fade_out", fadeOut);

            // Fade in animation (from black)
            var fadeIn = new Animation
            {
                Length = FadeDuration
            };
            trackIdx = fadeIn.AddTrack(Animation.TrackType.Value);
            fadeIn.TrackSetPath(trackIdx, "fade_rect:modulate:a");
            fadeIn.TrackInsertKey(trackIdx, 0.0f, 1.0f);
            fadeIn.TrackInsertKey(trackIdx, FadeDuration, 0.0f);
            animLibrary.AddAnimation("fade_in", fadeIn);

            _animationPlayer.AddAnimationLibrary("", animLibrary);
        }

        // Scene Transition Methods
        public async void ChangeScene(string scenePath, string transitionType = "fade")
        {
            switch (transitionType)
            {
                case "fade":
                    await FadeTransition(scenePath);
                    break;
                case "instant":
                    GetTree().ChangeSceneToFile(scenePath);
                    break;
                default:
                    await FadeTransition(scenePath);
                    break;
            }
        }

        private async void FadeTransition(string scenePath)
        {
            // Fade to black
            _fadeRect.Visible = true;
            _fadeRect.Modulate = new Color(1, 1, 1, 0);

            var tween = CreateTween();
            tween.TweenProperty(_fadeRect, "modulate:a", 1.0f, FadeDuration);
            await ToSignal(tween, Tween.SignalName.Finished);

            // Change scene
            Error result = GetTree().ChangeSceneToFile(scenePath);
            if (result != Error.Ok)
            {
                GD.PushError($"Failed to load scene: {scenePath}");
                return;
            }

            // Wait a frame for the new scene to load
            await ToSignal(GetTree(), SceneTree.SignalName.ProcessFrame);

            // Fade from black
            tween = CreateTween();
            tween.TweenProperty(_fadeRect, "modulate:a", 0.0f, FadeDuration);
            await ToSignal(tween, Tween.SignalName.Finished);

            _fadeRect.Visible = false;
        }

        public void ReloadCurrentScene(string transitionType = "fade")
        {
            ChangeScene(GetTree().CurrentScene.SceneFilePath, transitionType);
        }

        // Screen Effects
        public async void FlashScreen(Color color, float duration = 0.1f)
        {
            var flash = new ColorRect
            {
                Color = color,
                Modulate = new Color(1, 1, 1, 1)
            };
            flash.SetAnchorsPreset(Control.LayoutPreset.FullRect);
            AddChild(flash);

            var tween = CreateTween();
            tween.TweenProperty(flash, "modulate:a", 0.0f, duration);
            await ToSignal(tween, Tween.SignalName.Finished);

            flash.QueueFree();
        }

        public async void ShakeScreen(float intensity = 10.0f, float duration = 0.5f)
        {
            var camera = GetViewport().GetCamera2D();
            if (camera != null)
            {
                Vector2 originalPosition = camera.Position;
                float elapsed = 0.0f;

                while (elapsed < duration)
                {
                    Vector2 offset = new Vector2(
                        GD.Randf() * intensity * 2 - intensity,
                        GD.Randf() * intensity * 2 - intensity
                    );
                    camera.Position = originalPosition + offset;

                    await ToSignal(GetTree(), SceneTree.SignalName.ProcessFrame);
                    elapsed += GetProcessDeltaTime();
                    intensity = Mathf.Lerp(intensity, 0.0f, GetProcessDeltaTime() / duration);
                }

                camera.Position = originalPosition;
            }
        }
    }
}
