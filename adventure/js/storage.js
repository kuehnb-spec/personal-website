// Local Storage Manager
const Storage = {
    KEYS: {
        PLAYERS: 'adventure_players',
        API_CONFIG: 'adventure_api_config',
        STORY_PROGRESS: 'adventure_progress',
        CUSTOM_STORIES: 'adventure_custom_stories',
        THEME: 'adventure_theme',
        ACHIEVEMENTS: 'adventure_achievements',
        SETTINGS: 'adventure_settings',
        ENDINGS_COLLECTED: 'adventure_endings'
    },

    // Theme
    getTheme() {
        return localStorage.getItem(this.KEYS.THEME) || 'dark';
    },

    saveTheme(theme) {
        localStorage.setItem(this.KEYS.THEME, theme);
    },

    // Player data
    getPlayers() {
        const data = localStorage.getItem(this.KEYS.PLAYERS);
        return data ? JSON.parse(data) : null;
    },

    savePlayers(players) {
        localStorage.setItem(this.KEYS.PLAYERS, JSON.stringify(players));
    },

    // API configuration
    getAPIConfig() {
        const data = localStorage.getItem(this.KEYS.API_CONFIG);
        return data ? JSON.parse(data) : { provider: 'anthropic', apiKey: '' };
    },

    saveAPIConfig(config) {
        localStorage.setItem(this.KEYS.API_CONFIG, JSON.stringify(config));
    },

    // Story progress (which stories have been read, current position, etc.)
    getProgress(storyId) {
        const allProgress = this.getAllProgress();
        return allProgress[storyId] || null;
    },

    saveProgress(storyId, nodeId, visitedNodes = []) {
        const allProgress = this.getAllProgress();
        if (!allProgress[storyId]) {
            allProgress[storyId] = { timesPlayed: 0, endings: [], endingsData: [] };
        }
        allProgress[storyId].currentNode = nodeId;
        allProgress[storyId].lastPlayed = Date.now();
        allProgress[storyId].visitedNodes = visitedNodes;
        localStorage.setItem(this.KEYS.STORY_PROGRESS, JSON.stringify(allProgress));
    },

    completeStory(storyId, endingType, endingId = null) {
        const allProgress = this.getAllProgress();
        if (!allProgress[storyId]) {
            allProgress[storyId] = { timesPlayed: 0, endings: [], endingsData: [] };
        }

        const isFirstCompletion = !allProgress[storyId].endings.includes(endingType);

        allProgress[storyId].timesPlayed++;
        allProgress[storyId].currentNode = null;
        allProgress[storyId].visitedNodes = [];

        if (endingType && !allProgress[storyId].endings.includes(endingType)) {
            allProgress[storyId].endings.push(endingType);
        }

        // Track specific ending for endings gallery
        if (endingId) {
            if (!allProgress[storyId].endingsData) {
                allProgress[storyId].endingsData = [];
            }
            if (!allProgress[storyId].endingsData.find(e => e.id === endingId)) {
                allProgress[storyId].endingsData.push({
                    id: endingId,
                    type: endingType,
                    unlockedAt: Date.now()
                });
            }
        }

        localStorage.setItem(this.KEYS.STORY_PROGRESS, JSON.stringify(allProgress));

        // Also track in global endings collection
        this.trackEnding(storyId, endingId || `${storyId}_${endingType}`, endingType);

        return isFirstCompletion;
    },

    getAllProgress() {
        const data = localStorage.getItem(this.KEYS.STORY_PROGRESS);
        return data ? JSON.parse(data) : {};
    },

    // Get all story completions
    getCompletions() {
        const progress = this.getAllProgress();
        return Object.entries(progress)
            .filter(([_, data]) => data.timesPlayed > 0)
            .map(([storyId, data]) => ({ storyId, ...data }));
    },

    // Custom AI-generated stories
    getCustomStories() {
        const data = localStorage.getItem(this.KEYS.CUSTOM_STORIES);
        return data ? JSON.parse(data) : [];
    },

    saveCustomStory(story) {
        const stories = this.getCustomStories();
        stories.push(story);
        localStorage.setItem(this.KEYS.CUSTOM_STORIES, JSON.stringify(stories));
    },

    deleteCustomStory(storyId) {
        const stories = this.getCustomStories().filter(s => s.id !== storyId);
        localStorage.setItem(this.KEYS.CUSTOM_STORIES, JSON.stringify(stories));
    },

    // ============================================
    // ACHIEVEMENTS SYSTEM
    // ============================================

    getAchievements() {
        const data = localStorage.getItem(this.KEYS.ACHIEVEMENTS);
        return data ? JSON.parse(data) : [];
    },

    addAchievement(achievementId) {
        const achievements = this.getAchievements();
        if (!achievements.includes(achievementId)) {
            achievements.push(achievementId);
            localStorage.setItem(this.KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
            return true; // New achievement
        }
        return false; // Already had it
    },

    hasAchievement(achievementId) {
        return this.getAchievements().includes(achievementId);
    },

    // Achievement definitions
    ACHIEVEMENT_DEFINITIONS: {
        first_story: {
            id: 'first_story',
            icon: '📖',
            title: 'First Adventure',
            description: 'Complete your first story'
        },
        first_good_ending: {
            id: 'first_good_ending',
            icon: '🌟',
            title: 'Happy Ending',
            description: 'Get your first good ending'
        },
        explorer: {
            id: 'explorer',
            icon: '🗺️',
            title: 'Explorer',
            description: 'Make 10 choices in a single story'
        },
        collector: {
            id: 'collector',
            icon: '🏆',
            title: 'Collector',
            description: 'Find all endings in a story'
        },
        bookworm: {
            id: 'bookworm',
            icon: '📚',
            title: 'Bookworm',
            description: 'Complete 5 different stories'
        },
        speedrunner: {
            id: 'speedrunner',
            icon: '⚡',
            title: 'Speedrunner',
            description: 'Complete a story in under 2 minutes'
        },
        night_owl: {
            id: 'night_owl',
            icon: '🦉',
            title: 'Night Owl',
            description: 'Read a story in night mode'
        },
        replay_master: {
            id: 'replay_master',
            icon: '🔄',
            title: 'Replay Master',
            description: 'Play the same story 5 times'
        }
    },

    // ============================================
    // SETTINGS SYSTEM
    // ============================================

    getSetting(key) {
        const settings = this.getAllSettings();
        return settings[key] !== undefined ? settings[key] : null;
    },

    setSetting(key, value) {
        const settings = this.getAllSettings();
        settings[key] = value;
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    },

    getAllSettings() {
        const data = localStorage.getItem(this.KEYS.SETTINGS);
        return data ? JSON.parse(data) : {
            soundEnabled: true,
            typewriterEnabled: true,
            transitionType: 'page-turn'
        };
    },

    // ============================================
    // ENDINGS GALLERY
    // ============================================

    trackEnding(storyId, endingId, endingType) {
        const endings = this.getAllEndings();
        const key = `${storyId}:${endingId}`;

        if (!endings[key]) {
            endings[key] = {
                storyId,
                endingId,
                type: endingType,
                unlockedAt: Date.now()
            };
            localStorage.setItem(this.KEYS.ENDINGS_COLLECTED, JSON.stringify(endings));
            return true; // New ending
        }
        return false; // Already collected
    },

    getAllEndings() {
        const data = localStorage.getItem(this.KEYS.ENDINGS_COLLECTED);
        return data ? JSON.parse(data) : {};
    },

    getEndingsForStory(storyId) {
        const allEndings = this.getAllEndings();
        return Object.values(allEndings).filter(e => e.storyId === storyId);
    },

    getEndingsCount() {
        return Object.keys(this.getAllEndings()).length;
    },

    // ============================================
    // STATISTICS
    // ============================================

    getStats() {
        const progress = this.getAllProgress();
        const achievements = this.getAchievements();
        const endings = this.getAllEndings();

        let totalPlays = 0;
        let storiesCompleted = 0;
        let totalChoicesMade = 0;

        Object.values(progress).forEach(p => {
            totalPlays += p.timesPlayed || 0;
            if (p.timesPlayed > 0) storiesCompleted++;
        });

        return {
            totalPlays,
            storiesCompleted,
            achievementsUnlocked: achievements.length,
            endingsCollected: Object.keys(endings).length,
            totalAchievements: Object.keys(this.ACHIEVEMENT_DEFINITIONS).length
        };
    },

    // ============================================
    // DATA MANAGEMENT
    // ============================================

    // Export all user data
    exportData() {
        return {
            players: this.getPlayers(),
            progress: this.getAllProgress(),
            achievements: this.getAchievements(),
            settings: this.getAllSettings(),
            endings: this.getAllEndings(),
            theme: this.getTheme(),
            customStories: this.getCustomStories(),
            exportedAt: Date.now()
        };
    },

    // Import user data
    importData(data) {
        if (data.players) this.savePlayers(data.players);
        if (data.progress) {
            localStorage.setItem(this.KEYS.STORY_PROGRESS, JSON.stringify(data.progress));
        }
        if (data.achievements) {
            localStorage.setItem(this.KEYS.ACHIEVEMENTS, JSON.stringify(data.achievements));
        }
        if (data.settings) {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(data.settings));
        }
        if (data.endings) {
            localStorage.setItem(this.KEYS.ENDINGS_COLLECTED, JSON.stringify(data.endings));
        }
        if (data.theme) this.saveTheme(data.theme);
        if (data.customStories) {
            localStorage.setItem(this.KEYS.CUSTOM_STORIES, JSON.stringify(data.customStories));
        }
    },

    // Clear all data
    clearAllData() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
};
