using Godot;
using System.Collections.Generic;

namespace GodotGame
{
    /// <summary>
    /// Audio Manager - Autoload Singleton
    /// Handles all audio playback, sound effects, and music
    /// </summary>
    public partial class AudioManager : Node
    {
        // Audio buses
        private const string MasterBus = "Master";
        private const string MusicBus = "Music";
        private const string SfxBus = "SFX";

        // Audio players
        private AudioStreamPlayer _musicPlayer;
        private AudioStreamPlayer _sfxPlayer;

        // Audio resources
        private Dictionary<string, AudioStream> _musicTracks = new();
        private Dictionary<string, AudioStream> _soundEffects = new();

        // Volume settings
        private float _masterVolume = 1.0f;
        private float _musicVolume = 0.6f;
        private float _sfxVolume = 0.8f;

        // Singleton instance
        public static AudioManager Instance { get; private set; }

        public override void _Ready()
        {
            Instance = this;
            
            // Create audio players
            _musicPlayer = new AudioStreamPlayer();
            _sfxPlayer = new AudioStreamPlayer();
            
            AddChild(_musicPlayer);
            AddChild(_sfxPlayer);
            
            SetupAudioBuses();
            LoadVolumes();
            
            GD.Print("AudioManager initialized");
        }

        private void SetupAudioBuses()
        {
            // Ensure audio buses exist
            if (!AudioServer.IsBusNameUnique(MusicBus))
            {
                AudioServer.AddBus();
                AudioServer.SetBusName(AudioServer.BusCount - 1, MusicBus);
            }

            if (!AudioServer.IsBusNameUnique(SfxBus))
            {
                AudioServer.AddBus();
                AudioServer.SetBusName(AudioServer.BusCount - 1, SfxBus);
            }
        }

        private void LoadVolumes()
        {
            var config = new ConfigFile();
            Error err = config.Load("user://settings.cfg");
            if (err == Error.Ok)
            {
                _masterVolume = (float)config.GetValue("audio", "master_volume", 1.0);
                _musicVolume = (float)config.GetValue("audio", "music_volume", 0.6);
                _sfxVolume = (float)config.GetValue("audio", "sfx_volume", 0.8);
                ApplyVolumes();
            }
        }

        private void ApplyVolumes()
        {
            AudioServer.SetBusVolumeDb(AudioServer.GetBusIndex(MasterBus), Mathf.LinearToDb(_masterVolume));
            AudioServer.SetBusVolumeDb(AudioServer.GetBusIndex(MusicBus), Mathf.LinearToDb(_musicVolume));
            AudioServer.SetBusVolumeDb(AudioServer.GetBusIndex(SfxBus), Mathf.LinearToDb(_sfxVolume));
        }

        // Music Management
        public void PlayMusic(string trackName, float fadeDuration = 1.0f)
        {
            if (_musicTracks.ContainsKey(trackName))
            {
                var newTrack = _musicTracks[trackName];
                if (_musicPlayer.Stream != newTrack)
                {
                    FadeMusic(newTrack, fadeDuration);
                }
            }
        }

        private async void FadeMusic(AudioStream newStream, float duration)
        {
            var tween = CreateTween();
            tween.TweenProperty(_musicPlayer, "volume_db", -80.0f, duration / 2.0f);
            await ToSignal(tween, Tween.SignalName.Finished);

            _musicPlayer.Stream = newStream;
            _musicPlayer.Play();

            tween = CreateTween();
            tween.TweenProperty(_musicPlayer, "volume_db", Mathf.LinearToDb(_musicVolume), duration / 2.0f);
        }

        public void StopMusic(float fadeDuration = 1.0f)
        {
            var tween = CreateTween();
            tween.TweenProperty(_musicPlayer, "volume_db", -80.0f, fadeDuration);
            tween.Finished += () => _musicPlayer.Stop();
        }

        public void PauseMusic()
        {
            _musicPlayer.StreamPaused = true;
        }

        public void ResumeMusic()
        {
            _musicPlayer.StreamPaused = false;
        }

        // Sound Effects
        public async void PlaySfx(string soundName, float pitchVariation = 0.0f)
        {
            if (_soundEffects.ContainsKey(soundName))
            {
                var player = new AudioStreamPlayer
                {
                    Stream = _soundEffects[soundName],
                    Bus = SfxBus
                };

                if (pitchVariation > 0)
                {
                    player.PitchScale = 1.0f + GD.Randf() * pitchVariation * 2 - pitchVariation;
                }

                AddChild(player);
                player.Play();

                await ToSignal(player, AudioStreamPlayer.SignalName.Finished);
                player.QueueFree();
            }
        }

        public async void PlaySfxAtPosition(string soundName, Vector2 position)
        {
            if (_soundEffects.ContainsKey(soundName))
            {
                var player = new AudioStreamPlayer2D
                {
                    Stream = _soundEffects[soundName],
                    Position = position,
                    Bus = SfxBus
                };

                AddChild(player);
                player.Play();

                await ToSignal(player, AudioStreamPlayer2D.SignalName.Finished);
                player.QueueFree();
            }
        }

        // Volume Controls
        public void SetMasterVolume(float value)
        {
            _masterVolume = Mathf.Clamp(value, 0.0f, 1.0f);
            AudioServer.SetBusVolumeDb(AudioServer.GetBusIndex(MasterBus), Mathf.LinearToDb(_masterVolume));
        }

        public void SetMusicVolume(float value)
        {
            _musicVolume = Mathf.Clamp(value, 0.0f, 1.0f);
            AudioServer.SetBusVolumeDb(AudioServer.GetBusIndex(MusicBus), Mathf.LinearToDb(_musicVolume));
        }

        public void SetSfxVolume(float value)
        {
            _sfxVolume = Mathf.Clamp(value, 0.0f, 1.0f);
            AudioServer.SetBusVolumeDb(AudioServer.GetBusIndex(SfxBus), Mathf.LinearToDb(_sfxVolume));
        }

        public float GetMasterVolume() => _masterVolume;
        public float GetMusicVolume() => _musicVolume;
        public float GetSfxVolume() => _sfxVolume;

        // Resource Loading
        public void LoadAudioResources()
        {
            // Load music tracks
            _musicTracks["main_theme"] = GD.Load<AudioStream>("res://assets/audio/music/main_theme.ogg");
            _musicTracks["level_1"] = GD.Load<AudioStream>("res://assets/audio/music/level_1.ogg");
            _musicTracks["boss_battle"] = GD.Load<AudioStream>("res://assets/audio/music/boss_battle.ogg");

            // Load sound effects
            _soundEffects["jump"] = GD.Load<AudioStream>("res://assets/audio/sfx/jump.wav");
            _soundEffects["attack"] = GD.Load<AudioStream>("res://assets/audio/sfx/attack.wav");
            _soundEffects["hit"] = GD.Load<AudioStream>("res://assets/audio/sfx/hit.wav");
            _soundEffects["coin"] = GD.Load<AudioStream>("res://assets/audio/sfx/coin.wav");
            _soundEffects["powerup"] = GD.Load<AudioStream>("res://assets/audio/sfx/powerup.wav");
            _soundEffects["explosion"] = GD.Load<AudioStream>("res://assets/audio/sfx/explosion.wav");
        }
    }
}
