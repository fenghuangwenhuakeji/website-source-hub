using Godot;
using System;

namespace GodotGame
{
    /// <summary>
    /// Game Manager - Autoload Singleton
    /// Handles game state, score, level management, and global game logic
    /// </summary>
    public partial class GameManager : Node
    {
        // Signals
        [Signal]
        public delegate void ScoreChangedEventHandler(int newScore);
        
        [Signal]
        public delegate void LivesChangedEventHandler(int newLives);
        
        [Signal]
        public delegate void GameOverEventHandler();
        
        [Signal]
        public delegate void LevelCompletedEventHandler(int level);

        // Game States
        public enum GameState
        {
            Menu,
            Playing,
            Paused,
            GameOver,
            LevelComplete
        }

        // Current game state
        public GameState CurrentState { get; private set; } = GameState.Menu;

        // Player stats
        private int _score = 0;
        public int Score
        {
            get => _score;
            set
            {
                _score = value;
                EmitSignal(SignalName.ScoreChanged, _score);
            }
        }

        private int _lives = 3;
        public int Lives
        {
            get => _lives;
            set
            {
                _lives = Math.Max(0, value);
                EmitSignal(SignalName.LivesChanged, _lives);
                if (_lives <= 0)
                {
                    EmitSignal(SignalName.GameOver);
                }
            }
        }

        public int CurrentLevel { get; private set; } = 1;
        public int MaxLevels { get; private set; } = 5;

        // Game settings
        public GameSettings Settings { get; private set; } = new GameSettings();

        // Singleton instance
        public static GameManager Instance { get; private set; }

        public override void _Ready()
        {
            Instance = this;
            GD.Print("GameManager initialized");
            LoadSettings();
        }

        // State Management
        public void ChangeState(GameState newState)
        {
            CurrentState = newState;
            switch (CurrentState)
            {
                case GameState.Menu:
                case GameState.Playing:
                case GameState.GameOver:
                case GameState.LevelComplete:
                    Engine.TimeScale = 1.0f;
                    break;
                case GameState.Paused:
                    Engine.TimeScale = 0.0f;
                    break;
            }
        }

        public void StartGame()
        {
            Score = 0;
            Lives = 3;
            CurrentLevel = 1;
            ChangeState(GameState.Playing);
            GetTree().ChangeSceneToFile("res://scenes/level_1.tscn");
        }

        public void PauseGame()
        {
            if (CurrentState == GameState.Playing)
            {
                ChangeState(GameState.Paused);
            }
            else if (CurrentState == GameState.Paused)
            {
                ChangeState(GameState.Playing);
            }
        }

        public void ResumeGame()
        {
            ChangeState(GameState.Playing);
        }

        public void RestartGame()
        {
            StartGame();
        }

        public void ReturnToMenu()
        {
            ChangeState(GameState.Menu);
            GetTree().ChangeSceneToFile("res://scenes/main_menu.tscn");
        }

        // Score Management
        public void AddScore(int points)
        {
            Score += points;
        }

        // Lives Management
        public void LoseLife()
        {
            Lives--;
        }

        public void AddLife()
        {
            Lives++;
        }

        // Level Management
        public async void CompleteLevel()
        {
            EmitSignal(SignalName.LevelCompleted, CurrentLevel);
            
            if (CurrentLevel < MaxLevels)
            {
                CurrentLevel++;
                ChangeState(GameState.LevelComplete);
                await ToSignal(GetTree().CreateTimer(2.0f), SceneTreeTimer.SignalName.Timeout);
                GetTree().ChangeSceneToFile($"res://scenes/level_{CurrentLevel}.tscn");
                ChangeState(GameState.Playing);
            }
            else
            {
                EmitSignal(SignalName.GameOver);
            }
        }

        // Settings Management
        private void LoadSettings()
        {
            var config = new ConfigFile();
            Error err = config.Load("user://settings.cfg");
            if (err == Error.Ok)
            {
                Settings.Difficulty = (float)config.GetValue("game", "difficulty", 1.0);
                Settings.SoundVolume = (float)config.GetValue("audio", "sound_volume", 0.8);
                Settings.MusicVolume = (float)config.GetValue("audio", "music_volume", 0.6);
                Settings.Fullscreen = (bool)config.GetValue("display", "fullscreen", false);
            }
        }

        public void SaveSettings()
        {
            var config = new ConfigFile();
            config.SetValue("game", "difficulty", Settings.Difficulty);
            config.SetValue("audio", "sound_volume", Settings.SoundVolume);
            config.SetValue("audio", "music_volume", Settings.MusicVolume);
            config.SetValue("display", "fullscreen", Settings.Fullscreen);
            config.Save("user://settings.cfg");
        }

        public void SetDifficulty(float value)
        {
            Settings.Difficulty = Mathf.Clamp(value, 0.5f, 2.0f);
        }

        public float GetDifficulty()
        {
            return Settings.Difficulty;
        }
    }

    // Game Settings Class
    public class GameSettings
    {
        public float Difficulty { get; set; } = 1.0f;
        public float SoundVolume { get; set; } = 0.8f;
        public float MusicVolume { get; set; } = 0.6f;
        public bool Fullscreen { get; set; } = false;
    }
}
