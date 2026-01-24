// Main Application Controller
const App = {
    // DOM Elements
    screens: {
        setup: document.getElementById('setup-screen'),
        library: document.getElementById('library-screen'),
        reader: document.getElementById('reader-screen')
    },
    modals: {
        settings: document.getElementById('settings-modal'),
        creator: document.getElementById('creator-modal'),
        storyInfo: document.getElementById('story-info-modal'),
        achievements: document.getElementById('achievements-modal'),
        endingsGallery: document.getElementById('endings-gallery-modal')
    },

    // Initialize the app
    async init() {
        // Apply saved theme immediately
        this.applyTheme(Storage.getTheme());

        // Check if players are already set up
        const players = Storage.getPlayers();

        if (players) {
            // Go straight to library
            await this.showLibrary();
        } else {
            // Show setup screen
            this.showScreen('setup');
        }

        this.bindEvents();
    },

    // Apply theme to document
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        // Update theme toggle buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    },

    // Show a specific screen
    showScreen(screenName) {
        Object.values(this.screens).forEach(s => s.classList.add('hidden'));
        this.screens[screenName].classList.remove('hidden');
    },

    // Show the library screen
    async showLibrary() {
        await Stories.loadAll();
        this.renderLibrary();
        this.showScreen('library');
    },

    // Render the story library
    renderLibrary() {
        const container = document.getElementById('story-library');
        const stories = Stories.getAllStories();
        const progress = Storage.getAllProgress();

        container.innerHTML = '';

        stories.forEach(story => {
            const meta = Stories.getStoryMeta(story);
            const storyProgress = progress[story.id];

            const card = document.createElement('div');
            card.className = 'story-card';

            card.innerHTML = `
                <button class="story-info-btn" data-story-id="${story.id}" title="Story Info">ℹ️</button>
                <div class="story-card-image">${meta.coverEmoji || '📚'}</div>
                <div class="story-card-content">
                    <h3 class="story-card-title">${meta.title}</h3>
                    <p class="story-card-description">${meta.description || ''}</p>
                    <div class="story-card-meta">
                        <span>⏱️ ${meta.estimatedMinutes || '?'} min</span>
                        ${storyProgress ? `<span>🎮 Played ${storyProgress.timesPlayed}x</span>` : ''}
                    </div>
                </div>
            `;

            // Click on card to play (but not if clicking info button)
            card.onclick = (e) => {
                if (!e.target.classList.contains('story-info-btn')) {
                    this.openStory(story.id);
                }
            };

            // Info button click
            card.querySelector('.story-info-btn').onclick = (e) => {
                e.stopPropagation();
                this.showStoryInfo(story.id);
            };

            container.appendChild(card);
        });

        // Show message if no stories
        if (stories.length === 0) {
            container.innerHTML = '<p class="no-stories">No stories available yet!</p>';
        }
    },

    // Open a story for reading
    openStory(storyId) {
        Reader.start(storyId);
        this.showScreen('reader');
    },

    // Bind all event listeners
    bindEvents() {
        // Setup screen events
        this.bindSetupEvents();

        // Reader events
        document.getElementById('back-to-library').onclick = () => {
            this.cleanupReader();
            this.showLibrary();
        };
        document.getElementById('restart-story').onclick = () => Reader.restart();
        document.getElementById('play-again').onclick = () => Reader.restart();
        document.getElementById('choose-another').onclick = () => {
            this.cleanupReader();
            this.showLibrary();
        };

        // Settings
        document.getElementById('settings-btn').onclick = () => this.openSettings();
        document.getElementById('save-settings').onclick = () => this.saveSettings();
        document.getElementById('cancel-settings').onclick = () => this.closeSettings();

        // Creator
        document.getElementById('create-story-btn').onclick = () => this.openCreator();
        document.getElementById('cancel-creator').onclick = () => this.closeCreator();
        document.getElementById('generate-story').onclick = () => this.generateStory();

        // Story Info modal
        document.getElementById('close-story-info')?.addEventListener('click', () => this.closeStoryInfo());
        document.getElementById('play-from-info')?.addEventListener('click', () => this.playFromInfo());

        // Close story info on backdrop click
        this.modals.storyInfo?.addEventListener('click', (e) => {
            if (e.target === this.modals.storyInfo) this.closeStoryInfo();
        });

        // Achievements modal
        document.getElementById('achievements-btn')?.addEventListener('click', () => this.openAchievements());
        document.getElementById('close-achievements')?.addEventListener('click', () => this.closeAchievements());
        document.getElementById('close-achievements-btn')?.addEventListener('click', () => this.closeAchievements());
        this.modals.achievements?.addEventListener('click', (e) => {
            if (e.target === this.modals.achievements) this.closeAchievements();
        });

        // Endings Gallery modal
        document.getElementById('endings-gallery-btn')?.addEventListener('click', () => this.openEndingsGallery());
        document.getElementById('close-endings-gallery')?.addEventListener('click', () => this.closeEndingsGallery());
        document.getElementById('close-endings-btn')?.addEventListener('click', () => this.closeEndingsGallery());
        this.modals.endingsGallery?.addEventListener('click', (e) => {
            if (e.target === this.modals.endingsGallery) this.closeEndingsGallery();
        });

        // Parent Mode / Tree View
        document.getElementById('parent-mode-btn')?.addEventListener('click', () => this.openTreeView());
        document.getElementById('close-tree-view')?.addEventListener('click', () => this.closeTreeView());
    },

    // Setup screen event bindings
    bindSetupEvents() {
        const player1Name = document.getElementById('player1-name');
        const player2Name = document.getElementById('player2-name');
        const startBtn = document.getElementById('start-adventure');

        let player1Pronoun = null;
        let player2Pronoun = null;

        // Pronoun button clicks
        document.querySelectorAll('.pronoun-btn').forEach(btn => {
            btn.onclick = () => {
                const player = btn.dataset.player;
                const pronoun = btn.dataset.pronoun;

                // Update selection UI
                document.querySelectorAll(`.pronoun-btn[data-player="${player}"]`).forEach(b => {
                    b.classList.remove('selected');
                });
                btn.classList.add('selected');

                // Store selection
                if (player === '1') player1Pronoun = pronoun;
                if (player === '2') player2Pronoun = pronoun;

                checkComplete();
            };
        });

        // Name inputs
        player1Name.oninput = checkComplete;
        player2Name.oninput = checkComplete;

        // Check if setup is complete
        function checkComplete() {
            const complete = player1Name.value.trim() &&
                           player2Name.value.trim() &&
                           player1Pronoun &&
                           player2Pronoun;
            startBtn.disabled = !complete;
        }

        // Start button
        startBtn.onclick = async () => {
            const players = {
                player1: {
                    name: player1Name.value.trim(),
                    pronoun: player1Pronoun
                },
                player2: {
                    name: player2Name.value.trim(),
                    pronoun: player2Pronoun
                }
            };

            Storage.savePlayers(players);
            await this.showLibrary();
        };
    },

    // Settings modal
    openSettings() {
        const players = Storage.getPlayers();
        const apiConfig = Storage.getAPIConfig();
        const currentTheme = Storage.getTheme();
        const settings = Storage.getAllSettings();

        document.getElementById('edit-player1-name').value = players?.player1?.name || '';
        document.getElementById('edit-player2-name').value = players?.player2?.name || '';
        document.getElementById('api-provider').value = apiConfig.provider || 'anthropic';
        document.getElementById('api-key').value = apiConfig.apiKey || '';

        // Set current theme button active
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === currentTheme);
        });

        // Bind theme button clicks
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.onclick = () => {
                const theme = btn.dataset.theme;
                this.applyTheme(theme);
                Storage.saveTheme(theme);
            };
        });

        // Sound toggle
        const soundBtn = document.getElementById('toggle-sound');
        if (soundBtn) {
            this.updateToggleBtn(soundBtn, settings.soundEnabled !== false);
            soundBtn.onclick = () => {
                const newState = Reader.toggleSound();
                this.updateToggleBtn(soundBtn, newState);
            };
        }

        // Typewriter toggle
        const typewriterBtn = document.getElementById('toggle-typewriter');
        if (typewriterBtn) {
            this.updateToggleBtn(typewriterBtn, settings.typewriterEnabled !== false);
            typewriterBtn.onclick = () => {
                const newState = Reader.toggleTypewriter();
                this.updateToggleBtn(typewriterBtn, newState);
            };
        }

        // Transition style
        const transitionSelect = document.getElementById('transition-style');
        if (transitionSelect) {
            transitionSelect.value = settings.transitionType || 'page-turn';
            transitionSelect.onchange = () => {
                Reader.setTransitionType(transitionSelect.value);
            };
        }

        this.modals.settings.classList.remove('hidden');
    },

    // Update toggle button appearance
    updateToggleBtn(btn, isActive) {
        btn.classList.toggle('active', isActive);
        const label = btn.querySelector('.toggle-label');
        if (label) {
            label.textContent = isActive ? 'On' : 'Off';
        }
    },

    closeSettings() {
        this.modals.settings.classList.add('hidden');
    },

    saveSettings() {
        const players = Storage.getPlayers() || { player1: {}, player2: {} };

        // Update names (keep genders)
        players.player1.name = document.getElementById('edit-player1-name').value.trim() || players.player1.name;
        players.player2.name = document.getElementById('edit-player2-name').value.trim() || players.player2.name;

        Storage.savePlayers(players);

        // Save API config
        const apiConfig = {
            provider: document.getElementById('api-provider').value,
            apiKey: document.getElementById('api-key').value
        };
        Storage.saveAPIConfig(apiConfig);

        this.closeSettings();
        this.renderLibrary(); // Refresh to show updated names
    },

    // Creator modal
    openCreator() {
        const apiConfig = Storage.getAPIConfig();
        if (!apiConfig.apiKey) {
            alert('Please add an API key in Settings first to create custom stories.');
            this.openSettings();
            return;
        }

        document.getElementById('story-theme').value = 'fantasy';
        document.getElementById('story-premise').value = '';
        document.getElementById('generation-progress').classList.add('hidden');

        this.modals.creator.classList.remove('hidden');
    },

    closeCreator() {
        this.modals.creator.classList.add('hidden');
    },

    // Story Info modal
    showStoryInfo(storyId) {
        const story = Stories.getStory(storyId);
        if (!story) return;

        const stats = Stories.getStoryStats(story);
        const meta = Stories.getStoryMeta(story);

        // Populate the modal
        document.getElementById('story-info-emoji').textContent = meta.coverEmoji || '📚';
        document.getElementById('story-info-title').textContent = meta.title;
        document.getElementById('story-info-description').textContent = meta.description || 'No description available.';

        // Stats
        document.getElementById('story-info-moments').textContent = stats.totalNodes;
        document.getElementById('story-info-endings').textContent = `${stats.totalEndings} (${stats.goodEndings} good)`;
        document.getElementById('story-info-time').textContent = meta.estimatedMinutes ? `~${meta.estimatedMinutes} min` : 'Unknown';
        document.getElementById('story-info-age').textContent = story.ageRange || '8-10';

        // Themes
        const themesEl = document.getElementById('story-info-themes');
        if (story.themes && story.themes.length > 0) {
            themesEl.innerHTML = story.themes.map(t => `<span class="theme-tag">${t}</span>`).join('');
        } else {
            themesEl.innerHTML = '<span class="theme-tag">adventure</span>';
        }

        // Content notes
        const notesEl = document.getElementById('story-info-notes');
        if (story.contentNotes && story.contentNotes.length > 0) {
            notesEl.textContent = story.contentNotes.join(', ');
            notesEl.parentElement.classList.remove('hidden');
        } else {
            notesEl.parentElement.classList.add('hidden');
        }

        // Store story ID for play button
        this.modals.storyInfo.dataset.storyId = storyId;
        this.modals.storyInfo.classList.remove('hidden');
    },

    closeStoryInfo() {
        this.modals.storyInfo.classList.add('hidden');
    },

    playFromInfo() {
        const storyId = this.modals.storyInfo.dataset.storyId;
        this.closeStoryInfo();
        if (storyId) {
            this.openStory(storyId);
        }
    },

    // Achievements Modal
    openAchievements() {
        const unlockedAchievements = Storage.getAchievements();
        const allAchievements = Storage.ACHIEVEMENT_DEFINITIONS;

        // Update counts
        document.getElementById('achievements-count').textContent = unlockedAchievements.length;
        document.getElementById('achievements-total').textContent = Object.keys(allAchievements).length;

        // Render achievement grid
        const grid = document.getElementById('achievements-grid');
        grid.innerHTML = '';

        Object.values(allAchievements).forEach(achievement => {
            const isUnlocked = unlockedAchievements.includes(achievement.id);

            const item = document.createElement('div');
            item.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
            item.innerHTML = `
                <div class="achievement-item-icon">${isUnlocked ? achievement.icon : '❓'}</div>
                <div class="achievement-item-info">
                    <h4>${isUnlocked ? achievement.title : '???'}</h4>
                    <p>${isUnlocked ? achievement.description : 'Keep exploring to unlock!'}</p>
                </div>
            `;
            grid.appendChild(item);
        });

        this.modals.achievements.classList.remove('hidden');
    },

    closeAchievements() {
        this.modals.achievements.classList.add('hidden');
    },

    // Endings Gallery Modal
    openEndingsGallery() {
        const allStories = Stories.getAllStories();
        const collectedEndings = Storage.getAllEndings();
        const gallery = document.getElementById('endings-gallery');

        gallery.innerHTML = '';

        let totalEndings = 0;
        let collectedCount = 0;

        allStories.forEach(story => {
            // Get all ending nodes from this story
            const endingNodes = Object.values(story.nodes).filter(n => n.isEnding);
            totalEndings += endingNodes.length;

            endingNodes.forEach(ending => {
                const key = `${story.id}:${ending.id}`;
                const isCollected = collectedEndings[key];

                if (isCollected) collectedCount++;

                const card = document.createElement('div');
                card.className = `ending-card ${isCollected ? 'unlocked' : 'locked'}`;

                const endingEmoji = this.getEndingEmoji(ending.endingType);
                const endingTypeLabel = this.getEndingTypeLabel(ending.endingType);

                card.innerHTML = `
                    <div class="ending-card-emoji">${isCollected ? (ending.emoji || endingEmoji) : '❓'}</div>
                    <div class="ending-card-title">${isCollected ? (ending.endingTitle || `${story.title} Ending`) : '???'}</div>
                    <div class="ending-card-type">${isCollected ? endingTypeLabel : 'Undiscovered'}</div>
                `;

                if (isCollected) {
                    card.onclick = () => this.showEndingDetails(story, ending);
                }

                gallery.appendChild(card);
            });
        });

        // Update counter
        document.getElementById('endings-collected-count').textContent = `${collectedCount} / ${totalEndings}`;

        // Update progress bar
        const progressPercent = totalEndings > 0 ? (collectedCount / totalEndings) * 100 : 0;
        document.getElementById('endings-progress-fill').style.width = `${progressPercent}%`;

        this.modals.endingsGallery.classList.remove('hidden');
    },

    closeEndingsGallery() {
        this.modals.endingsGallery.classList.add('hidden');
    },

    getEndingEmoji(type) {
        switch(type) {
            case 'good': return '🌟';
            case 'bad': return '💔';
            case 'neutral': return '⚖️';
            default: return '🏁';
        }
    },

    getEndingTypeLabel(type) {
        switch(type) {
            case 'good': return 'Happy Ending';
            case 'bad': return 'Try Again';
            case 'neutral': return 'Neutral Ending';
            default: return 'Ending';
        }
    },

    showEndingDetails(story, ending) {
        // Could show a preview of the ending text
        alert(`${story.title}\n\n${ending.text?.substring(0, 200)}...`);
    },

    // Tree View
    openTreeView() {
        const modal = document.getElementById('tree-view-modal');
        if (modal) {
            modal.classList.remove('hidden');
            // Initialize tree view if TreeView object exists
            if (typeof TreeView !== 'undefined') {
                TreeView.init();
            }
        }
    },

    closeTreeView() {
        const modal = document.getElementById('tree-view-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    // Cleanup reader screen elements when leaving
    cleanupReader() {
        // Remove ambient background
        const ambientBg = document.querySelector('.ambient-bg');
        if (ambientBg) ambientBg.remove();

        // Remove progress path
        const progressPath = document.querySelector('.progress-path');
        if (progressPath) progressPath.remove();

        // Remove any floating elements
        document.querySelectorAll('.emoji-reaction, .confetti-container, .achievement-popup').forEach(el => el.remove());
    },

    // Generate a new story using AI
    async generateStory() {
        const apiConfig = Storage.getAPIConfig();
        const theme = document.getElementById('story-theme').value;
        const premise = document.getElementById('story-premise').value;
        const players = Storage.getPlayers();

        const progressDiv = document.getElementById('generation-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressStatus = document.getElementById('progress-status');

        progressDiv.classList.remove('hidden');
        progressFill.style.width = '10%';
        progressStatus.textContent = 'Preparing your adventure...';

        try {
            // Build the prompt
            const prompt = this.buildStoryPrompt(theme, premise, players);

            progressFill.style.width = '30%';
            progressStatus.textContent = 'Generating story nodes...';

            // Call the API
            const story = await this.callLLMAPI(apiConfig, prompt);

            progressFill.style.width = '90%';
            progressStatus.textContent = 'Saving your adventure...';

            // Save the story
            Storage.saveCustomStory(story);

            progressFill.style.width = '100%';
            progressStatus.textContent = 'Done!';

            setTimeout(() => {
                this.closeCreator();
                this.renderLibrary();
            }, 500);

        } catch (error) {
            console.error('Generation failed:', error);
            progressStatus.textContent = `Error: ${error.message}`;
            progressFill.style.width = '0%';
        }
    },

    // Build the story generation prompt
    buildStoryPrompt(theme, premise, players) {
        const themeDescriptions = {
            fantasy: 'fantasy adventure with magic, dragons, castles, and mythical creatures',
            space: 'space exploration with rockets, aliens, distant planets, and futuristic technology',
            pirates: 'pirate adventure with treasure hunts, sailing ships, and mysterious islands',
            dinosaurs: 'dinosaur adventure, possibly involving time travel to prehistoric times',
            underwater: 'underwater adventure with ocean exploration, sea creatures, and maybe mermaids',
            superhero: 'superhero story where the characters discover or use special powers'
        };

        return `Create a choose-your-own-adventure story for children ages 8-10.

THEME: ${themeDescriptions[theme]}
${premise ? `SPECIAL DETAILS: ${premise}` : ''}

MAIN CHARACTERS:
- {{PLAYER1_NAME}}: Use {{PLAYER1_HE_SHE}}, {{PLAYER1_HIM_HER}}, {{PLAYER1_HIS_HER}} for pronouns
- {{PLAYER2_NAME}}: Use {{PLAYER2_HE_SHE}}, {{PLAYER2_HIM_HER}}, {{PLAYER2_HIS_HER}} for pronouns
- Use {{BOTH_NAMES}} when referring to both characters together

STRUCTURE REQUIREMENTS:
- Create 15-25 nodes total
- Start node ID must be "start"
- Each non-ending node should have 2-3 choices
- Include at least 4 different endings (mix of good, neutral, and one instructive "bad" ending)
- Maximum depth of 5 levels from start to any ending
- Some branches should reconverge at key moments

CONTENT GUIDELINES:
- Age-appropriate (8-10 years old)
- Emphasize friendship, courage, kindness, and problem-solving
- No violence or scary content
- Choices should have meaningful consequences
- Include sensory details and engaging descriptions
- Each node should be 2-3 paragraphs

OUTPUT FORMAT:
Return a valid JSON object with this structure:
{
    "id": "unique-kebab-case-id",
    "title": "Story Title",
    "description": "Brief description using character variables",
    "coverEmoji": "single emoji for cover",
    "theme": "${theme}",
    "estimatedMinutes": 10,
    "isCustom": true,
    "startNode": "start",
    "nodes": {
        "start": {
            "id": "start",
            "text": "Opening story text...",
            "emoji": "relevant emoji",
            "choices": [
                {"text": "Choice text", "nextNodeId": "next-node-id"}
            ]
        },
        "ending-node": {
            "id": "ending-node",
            "text": "Ending story text...",
            "emoji": "🎉",
            "choices": [],
            "isEnding": true,
            "endingType": "good",
            "endingText": "Wrap-up text for the ending..."
        }
    }
}

Return ONLY the JSON object, no other text.`;
    },

    // Call the LLM API
    async callLLMAPI(config, prompt) {
        if (config.provider === 'anthropic') {
            return await this.callAnthropicAPI(config.apiKey, prompt);
        } else {
            return await this.callOpenAIAPI(config.apiKey, prompt);
        }
    },

    // Call Anthropic Claude API
    async callAnthropicAPI(apiKey, prompt) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 8000,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        const content = data.content[0].text;

        // Parse JSON from response
        return JSON.parse(content);
    },

    // Call OpenAI API
    async callOpenAIAPI(apiKey, prompt) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                max_tokens: 8000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Parse JSON from response
        return JSON.parse(content);
    }
};

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
