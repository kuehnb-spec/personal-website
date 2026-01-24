// Story Pack Management
const Stories = {
    // Built-in story packs (loaded from .adventure files)
    builtInStories: [],

    // Load all available stories
    async loadAll() {
        // List of built-in story packs (.adventure format)
        const storyFiles = [
            'stories/dragon-cave.adventure',
            'stories/space-academy.adventure',
            'stories/philosophers-garden.adventure',
            'stories/time-library.adventure',
            'stories/ocean-explorers.adventure',
            'stories/renaissance-workshop.adventure',
            'stories/ancient-egypt.adventure',
            'stories/symphony-quest.adventure',
            'stories/rainforest-rescue.adventure',
            'stories/mythology-maze.adventure',
            'stories/inventor-workshop.adventure',
            'stories/language-detective.adventure'
        ];

        this.builtInStories = [];

        for (const file of storyFiles) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const adventureFile = await response.json();
                    // Normalize .adventure format to internal format
                    const story = this.normalizeAdventureFormat(adventureFile);
                    this.builtInStories.push(story);
                }
            } catch (e) {
                console.error(`Failed to load story: ${file}`, e);
            }
        }

        return this.getAllStories();
    },

    // Convert .adventure format to internal format
    normalizeAdventureFormat(adventureFile) {
        // If it's already in the old format (no metadata wrapper), return as-is
        if (!adventureFile.metadata) {
            return adventureFile;
        }

        // Extract from .adventure format
        const { metadata, nodes, formatVersion } = adventureFile;

        return {
            // Core fields from metadata
            id: metadata.id,
            title: metadata.title,
            author: metadata.author,
            description: metadata.description,
            coverEmoji: metadata.coverEmoji,
            coverImage: metadata.coverImage,
            ageRange: metadata.ageRange,
            estimatedMinutes: metadata.estimatedMinutes,
            themes: metadata.themes,
            contentNotes: metadata.contentNotes,
            startNode: metadata.startNode,
            createdAt: metadata.createdAt,
            updatedAt: metadata.updatedAt,

            // Nodes
            nodes: nodes,

            // Store format version for future compatibility
            formatVersion: formatVersion
        };
    },

    // Get all stories (built-in + custom)
    getAllStories() {
        const customStories = Storage.getCustomStories();
        return [...this.builtInStories, ...customStories];
    },

    // Get a specific story by ID
    getStory(storyId) {
        const allStories = this.getAllStories();
        return allStories.find(s => s.id === storyId) || null;
    },

    // Get a specific node from a story
    getNode(storyId, nodeId) {
        const story = this.getStory(storyId);
        if (!story) return null;
        return story.nodes[nodeId] || null;
    },

    // Get story metadata for display (with variable substitution)
    getStoryMeta(story) {
        return Variables.substituteStoryMeta({
            id: story.id,
            title: story.title,
            description: story.description,
            coverEmoji: story.coverEmoji,
            theme: story.theme,
            estimatedMinutes: story.estimatedMinutes,
            isCustom: story.isCustom || false
        });
    },

    // Count nodes and endings in a story
    getStoryStats(story) {
        const nodes = Object.values(story.nodes);
        const endings = nodes.filter(n => n.isEnding);
        const goodEndings = endings.filter(n => n.endingType === 'good');

        return {
            totalNodes: nodes.length,
            totalEndings: endings.length,
            goodEndings: goodEndings.length
        };
    },

    // Get the story structure as a tree for parent view
    getStoryTree(storyId) {
        const story = this.getStory(storyId);
        if (!story) return null;

        const buildTree = (nodeId, visited = new Set()) => {
            if (visited.has(nodeId)) {
                return { nodeId, circular: true };
            }

            const node = story.nodes[nodeId];
            if (!node) return null;

            visited.add(nodeId);

            const treeNode = {
                nodeId: node.id,
                summary: node.summary || 'No summary',
                emoji: node.emoji,
                isEnding: node.isEnding || false,
                endingType: node.endingType,
                children: []
            };

            if (node.choices && node.choices.length > 0) {
                treeNode.children = node.choices.map(choice => ({
                    choiceText: choice.text,
                    child: buildTree(choice.nextNodeId, new Set(visited))
                }));
            }

            return treeNode;
        };

        return {
            storyId: story.id,
            title: story.title,
            root: buildTree(story.startNode)
        };
    }
};
