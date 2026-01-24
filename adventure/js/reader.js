// Story Reader with Enhanced Animations
const Reader = {
    currentStory: null,
    currentNode: null,
    visitedNodes: [],
    transitionType: 'page-turn', // 'page-turn', 'card-flip', 'swipe'
    typewriterEnabled: true,
    soundEnabled: true,

    // Audio elements for UI sounds
    sounds: {
        pageFlip: null,
        choiceHover: null,
        choiceClick: null,
        success: null,
        achievement: null
    },

    // Initialize sounds
    initSounds() {
        // Create audio context for generating sounds
        // Using Web Audio API for simple UI sounds
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    },

    // Play a UI sound
    playSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;

        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        switch(type) {
            case 'pageFlip':
                oscillator.frequency.setValueAtTime(800, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.15);
                break;
            case 'choiceHover':
                oscillator.frequency.setValueAtTime(600, ctx.currentTime);
                gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.05);
                break;
            case 'choiceClick':
                oscillator.frequency.setValueAtTime(400, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.15);
                break;
            case 'success':
                // Play a happy chord
                [523.25, 659.25, 783.99].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.setValueAtTime(freq, ctx.currentTime);
                    gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5 + i * 0.1);
                    osc.start(ctx.currentTime + i * 0.1);
                    osc.stop(ctx.currentTime + 0.5 + i * 0.1);
                });
                break;
            case 'achievement':
                // Fanfare
                [392, 523.25, 659.25, 783.99].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.setValueAtTime(freq, ctx.currentTime);
                    gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6 + i * 0.15);
                    osc.start(ctx.currentTime + i * 0.15);
                    osc.stop(ctx.currentTime + 0.6 + i * 0.15);
                });
                break;
        }
    },

    // Start reading a story
    start(storyId) {
        const story = Stories.getStory(storyId);
        if (!story) {
            console.error('Story not found:', storyId);
            return;
        }

        this.currentStory = story;
        this.visitedNodes = [];

        // Initialize sounds on first interaction
        if (!this.audioContext) {
            this.initSounds();
        }

        // Check for saved progress
        const progress = Storage.getProgress(storyId);
        const startNodeId = progress?.currentNode || story.startNode;

        // Load visited nodes from progress
        if (progress?.visitedNodes) {
            this.visitedNodes = progress.visitedNodes;
        }

        // Setup ambient background based on story theme
        this.setupAmbientBackground();

        // Show skeleton loading first
        this.showSkeleton();

        // Then navigate after a brief delay
        setTimeout(() => {
            this.navigateTo(startNodeId, false);
            this.updateHeader();
            this.updateProgressPath();
        }, 300);
    },

    // Show skeleton loading state
    showSkeleton() {
        const imageContainer = document.getElementById('story-image');
        const textContainer = document.getElementById('story-text');
        const choicesContainer = document.getElementById('choices-container');

        imageContainer.innerHTML = '<div class="skeleton skeleton-image"></div>';
        imageContainer.className = 'story-image';
        imageContainer.style.background = 'none';

        textContainer.innerHTML = `
            <div class="skeleton skeleton-text long"></div>
            <div class="skeleton skeleton-text long"></div>
            <div class="skeleton skeleton-text medium"></div>
            <div class="skeleton skeleton-text long"></div>
            <div class="skeleton skeleton-text short"></div>
        `;

        choicesContainer.innerHTML = `
            <div class="skeleton skeleton-choice"></div>
            <div class="skeleton skeleton-choice"></div>
            <div class="skeleton skeleton-choice"></div>
        `;
    },

    // Setup ambient animated background
    setupAmbientBackground() {
        // Remove existing ambient bg
        const existing = document.querySelector('.ambient-bg');
        if (existing) existing.remove();

        const ambientBg = document.createElement('div');
        ambientBg.className = 'ambient-bg';

        // Determine theme from story metadata
        const themes = this.currentStory.metadata?.themes || [];
        if (themes.includes('fantasy') || themes.includes('magic')) {
            ambientBg.classList.add('fantasy');
            this.addSparkles(ambientBg, 15);
        } else if (themes.includes('adventure')) {
            ambientBg.classList.add('adventure');
            this.addParticles(ambientBg, 10, '#10b981');
        } else if (themes.includes('mystery')) {
            ambientBg.classList.add('mystery');
        } else if (themes.includes('spooky') || themes.includes('scary')) {
            ambientBg.classList.add('spooky');
            this.addParticles(ambientBg, 8, '#8b5cf6');
        } else {
            ambientBg.classList.add('fantasy'); // Default
            this.addSparkles(ambientBg, 10);
        }

        document.getElementById('reader-screen').appendChild(ambientBg);
    },

    // Add floating sparkles
    addSparkles(container, count) {
        for (let i = 0; i < count; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = `${Math.random() * 100}%`;
            sparkle.style.top = `${Math.random() * 100}%`;
            sparkle.style.animationDelay = `${Math.random() * 3}s`;
            sparkle.style.animationDuration = `${2 + Math.random() * 2}s`;
            container.appendChild(sparkle);
        }
    },

    // Add floating particles
    addParticles(container, count, color) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'ambient-particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.width = `${5 + Math.random() * 10}px`;
            particle.style.height = particle.style.width;
            particle.style.background = color;
            particle.style.animationDuration = `${10 + Math.random() * 20}s`;
            particle.style.animationDelay = `${Math.random() * 10}s`;
            container.appendChild(particle);
        }
    },

    // Navigate to a specific node with transition
    navigateTo(nodeId, withTransition = true) {
        const node = Stories.getNode(this.currentStory.id, nodeId);
        if (!node) {
            console.error('Node not found:', nodeId);
            return;
        }

        // Track visited nodes
        if (!this.visitedNodes.includes(nodeId)) {
            this.visitedNodes.push(nodeId);
        }

        if (withTransition && this.currentNode) {
            this.transitionToNode(node);
        } else {
            this.currentNode = node;
            this.render();
        }

        // Save progress with visited nodes
        Storage.saveProgress(this.currentStory.id, nodeId, this.visitedNodes);
    },

    // Transition animation between nodes
    transitionToNode(newNode) {
        const storyPage = document.querySelector('.story-content');

        this.playSound('pageFlip');

        // Apply exit animation
        const exitClass = this.transitionType === 'page-turn' ? 'page-turn-out' :
                         this.transitionType === 'card-flip' ? 'card-flip-out' : 'swipe-left';

        storyPage.classList.add('story-page', exitClass);

        setTimeout(() => {
            // Update content
            this.currentNode = newNode;
            this.render();

            // Remove exit class and add enter class
            storyPage.classList.remove(exitClass);

            const enterClass = this.transitionType === 'page-turn' ? 'page-turn-in' :
                              this.transitionType === 'card-flip' ? 'card-flip-in' : 'swipe-in-left';

            storyPage.classList.add(enterClass);

            // Update progress path
            this.updateProgressPath();

            setTimeout(() => {
                storyPage.classList.remove('story-page', enterClass);
            }, 600);
        }, 400);
    },

    // Update progress path visualization
    updateProgressPath() {
        let progressPath = document.querySelector('.progress-path');

        if (!progressPath) {
            progressPath = document.createElement('div');
            progressPath.className = 'progress-path';
            document.getElementById('reader-screen').appendChild(progressPath);
        }

        // Clear and rebuild
        progressPath.innerHTML = '';

        // Show recent visited nodes (max 8)
        const recentNodes = this.visitedNodes.slice(-8);

        recentNodes.forEach((nodeId, index) => {
            const node = Stories.getNode(this.currentStory.id, nodeId);
            if (!node) return;

            // Add connector (except for first)
            if (index > 0) {
                const connector = document.createElement('div');
                connector.className = 'progress-connector visited';
                progressPath.appendChild(connector);
            }

            // Add node
            const progressNode = document.createElement('div');
            progressNode.className = 'progress-node visited';
            progressNode.setAttribute('data-title', this.getNodeSummary(node));

            if (nodeId === this.currentNode.id) {
                progressNode.classList.add('current');
            }

            if (node.isEnding) {
                progressNode.classList.add('ending');
            }

            progressNode.onclick = () => {
                // Allow clicking to go back (but warn it will lose progress)
                if (nodeId !== this.currentNode.id) {
                    this.navigateTo(nodeId);
                }
            };

            progressPath.appendChild(progressNode);
        });
    },

    // Get a short summary of a node
    getNodeSummary(node) {
        if (!node.text) return node.id;
        const words = node.text.split(' ').slice(0, 5).join(' ');
        return words + (node.text.split(' ').length > 5 ? '...' : '');
    },

    // Render the current node
    render() {
        const node = Variables.substituteNode(this.currentNode);

        // Update story image/emoji
        const imageContainer = document.getElementById('story-image');
        imageContainer.innerHTML = ''; // Clear skeleton
        if (node.image) {
            imageContainer.style.backgroundImage = `url(${node.image})`;
            imageContainer.textContent = '';
        } else {
            imageContainer.style.backgroundImage = 'none';
            imageContainer.textContent = node.emoji || '📖';
        }

        // Update story text with typewriter effect if enabled
        const textContainer = document.getElementById('story-text');

        if (this.typewriterEnabled) {
            this.renderTypewriter(textContainer, node.text);
        } else {
            textContainer.innerHTML = this.formatText(node.text);
        }

        // Update choices or ending
        const choicesContainer = document.getElementById('choices-container');
        const endingContainer = document.getElementById('ending-container');

        if (node.isEnding) {
            this.renderEnding(node);
            choicesContainer.classList.add('hidden');
            endingContainer.classList.remove('hidden');

            // Trigger confetti for good endings
            if (node.endingType === 'good') {
                setTimeout(() => this.showConfetti(), 500);
            }
        } else {
            // Delay choice rendering for typewriter effect
            const delay = this.typewriterEnabled ? Math.min(node.text.length * 10, 2000) : 0;
            setTimeout(() => {
                this.renderChoices(node.choices);
            }, delay);
            choicesContainer.classList.remove('hidden');
            endingContainer.classList.add('hidden');
        }
    },

    // Render text with typewriter effect
    renderTypewriter(container, text) {
        if (!text) {
            container.innerHTML = '';
            return;
        }

        const paragraphs = text.split('\n\n');
        container.innerHTML = '';

        let totalDelay = 0;

        paragraphs.forEach((paragraph, pIndex) => {
            const p = document.createElement('p');
            p.className = 'typewriter-container';
            container.appendChild(p);

            const words = paragraph.split(' ');

            words.forEach((word, wIndex) => {
                const span = document.createElement('span');
                span.className = 'typewriter-word';
                span.textContent = word;
                span.style.animationDelay = `${totalDelay}ms`;
                p.appendChild(span);

                // Add a space text node after each word (except the last)
                if (wIndex < words.length - 1) {
                    p.appendChild(document.createTextNode(' '));
                }
                totalDelay += 30; // 30ms per word
            });

            totalDelay += 100; // Extra pause between paragraphs
        });

        // Add cursor at the end
        const cursor = document.createElement('span');
        cursor.className = 'typewriter-cursor';
        cursor.style.animationDelay = `${totalDelay}ms`;
        container.appendChild(cursor);

        // Remove cursor after animation completes
        setTimeout(() => {
            cursor.remove();
        }, totalDelay + 2000);
    },

    // Format text with paragraphs
    formatText(text) {
        if (!text) return '';
        return text.split('\n\n').map(p => `<p>${p}</p>`).join('');
    },

    // Render choice buttons with bouncy animations
    renderChoices(choices) {
        const container = document.getElementById('choices-container');
        container.innerHTML = '';

        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = Variables.substitute(choice.text);
            button.style.animationDelay = `${index * 0.1}s`;

            // Sound on hover
            button.onmouseenter = () => this.playSound('choiceHover');

            // Bouncy click effect
            button.onclick = (e) => {
                this.playSound('choiceClick');
                button.classList.add('bounce-click');

                // Create emoji reaction at click position
                this.showEmojiReaction(e.clientX, e.clientY, '✨');

                setTimeout(() => {
                    this.makeChoice(choice.nextNodeId);
                }, 200);
            };

            container.appendChild(button);
        });
    },

    // Show floating emoji reaction
    showEmojiReaction(x, y, emoji) {
        const reaction = document.createElement('div');
        reaction.className = 'emoji-reaction';
        reaction.textContent = emoji;
        reaction.style.left = `${x}px`;
        reaction.style.top = `${y}px`;
        document.body.appendChild(reaction);

        setTimeout(() => reaction.remove(), 1500);
    },

    // Show confetti celebration
    showConfetti() {
        this.playSound('success');

        const container = document.createElement('div');
        container.className = 'confetti-container';
        document.body.appendChild(container);

        const colors = ['#7c3aed', '#f472b6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
        const shapes = ['square', 'circle'];

        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = `${Math.random() * 0.5}s`;
            confetti.style.animationDuration = `${2 + Math.random() * 2}s`;

            if (shapes[Math.floor(Math.random() * shapes.length)] === 'circle') {
                confetti.style.borderRadius = '50%';
            }

            container.appendChild(confetti);
        }

        // Remove after animation
        setTimeout(() => container.remove(), 4000);
    },

    // Show achievement popup
    showAchievement(icon, title) {
        this.playSound('achievement');

        const container = document.querySelector('.achievements-container') || (() => {
            const div = document.createElement('div');
            div.className = 'achievements-container';
            document.body.appendChild(div);
            return div;
        })();

        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
            <div class="achievement-icon">${icon}</div>
            <div class="achievement-content">
                <h4>Achievement Unlocked!</h4>
                <p>${title}</p>
            </div>
        `;

        container.appendChild(popup);

        // Remove after animation
        setTimeout(() => popup.remove(), 5000);
    },

    // Render ending screen
    renderEnding(node) {
        const badge = document.getElementById('ending-badge');
        const container = document.getElementById('ending-container');

        // Remove old classes
        container.className = 'ending';

        // Add ending type class
        const endingType = node.endingType || 'neutral';
        container.classList.add(`ending-${endingType}`);

        // Add ending text if available
        if (node.endingText) {
            const textContainer = document.getElementById('story-text');
            textContainer.innerHTML += `<div class="ending-message">${this.formatText(Variables.substitute(node.endingText))}</div>`;
        }

        // Save completion and check for new achievements
        const isFirstCompletion = Storage.completeStory(this.currentStory.id, node.endingType);

        // Check achievements
        this.checkAchievements(endingType, isFirstCompletion);
    },

    // Check and award achievements
    checkAchievements(endingType, isFirstCompletion) {
        const achievements = Storage.getAchievements();
        const completions = Storage.getCompletions();

        // First story completion
        if (completions.length === 1 && isFirstCompletion) {
            if (!achievements.includes('first_story')) {
                Storage.addAchievement('first_story');
                this.showAchievement('📖', 'First Adventure Complete!');
            }
        }

        // First good ending
        if (endingType === 'good' && isFirstCompletion) {
            if (!achievements.includes('first_good_ending')) {
                Storage.addAchievement('first_good_ending');
                setTimeout(() => {
                    this.showAchievement('🌟', 'Happy Ending!');
                }, 1000);
            }
        }

        // Explorer - visit 10 nodes in one story
        if (this.visitedNodes.length >= 10) {
            if (!achievements.includes('explorer')) {
                Storage.addAchievement('explorer');
                setTimeout(() => {
                    this.showAchievement('🗺️', 'Explorer - 10 choices made!');
                }, 2000);
            }
        }
    },

    // Make a choice
    makeChoice(nextNodeId) {
        this.navigateTo(nextNodeId, true);

        // Scroll to top of content
        document.querySelector('.story-content').scrollTop = 0;
    },

    // Restart the current story
    restart() {
        if (!this.currentStory) return;
        this.visitedNodes = [];
        this.navigateTo(this.currentStory.startNode, true);
    },

    // Update header with story title
    updateHeader() {
        const title = document.getElementById('story-title');
        title.textContent = Variables.substitute(this.currentStory.title);
    },

    // Toggle sound
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        Storage.setSetting('soundEnabled', this.soundEnabled);
        return this.soundEnabled;
    },

    // Toggle typewriter effect
    toggleTypewriter() {
        this.typewriterEnabled = !this.typewriterEnabled;
        Storage.setSetting('typewriterEnabled', this.typewriterEnabled);
        return this.typewriterEnabled;
    },

    // Set transition type
    setTransitionType(type) {
        if (['page-turn', 'card-flip', 'swipe'].includes(type)) {
            this.transitionType = type;
            Storage.setSetting('transitionType', type);
        }
    },

    // Load settings from storage
    loadSettings() {
        const soundEnabled = Storage.getSetting('soundEnabled');
        const typewriterEnabled = Storage.getSetting('typewriterEnabled');
        const transitionType = Storage.getSetting('transitionType');

        if (soundEnabled !== null) this.soundEnabled = soundEnabled;
        if (typewriterEnabled !== null) this.typewriterEnabled = typewriterEnabled;
        if (transitionType) this.transitionType = transitionType;
    }
};

// Load settings on page load
Reader.loadSettings();
