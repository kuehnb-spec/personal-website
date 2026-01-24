// Tree View for Parent Mode - Horizontal Column Layout
const TreeView = {
    modal: null,
    container: null,
    storySelect: null,
    currentStoryId: null,

    init() {
        this.modal = document.getElementById('tree-view-modal');
        this.container = document.getElementById('tree-view-container');
        this.storySelect = document.getElementById('tree-view-story-select');

        // Event listeners
        document.getElementById('parent-mode-btn')?.addEventListener('click', () => this.open());
        document.getElementById('close-tree-view')?.addEventListener('click', () => this.close());
        this.storySelect?.addEventListener('change', (e) => this.loadStory(e.target.value));

        // Close on backdrop click
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.close();
            }
        });
    },

    open() {
        this.populateStorySelect();
        this.modal.classList.remove('hidden');

        // Load first story if available
        if (this.storySelect.options.length > 0) {
            this.loadStory(this.storySelect.value);
        }
    },

    close() {
        this.modal.classList.add('hidden');
    },

    populateStorySelect() {
        const stories = Stories.getAllStories();
        this.storySelect.innerHTML = '';

        stories.forEach(story => {
            const option = document.createElement('option');
            option.value = story.id;
            option.textContent = `${story.coverEmoji || ''} ${story.title}`;
            this.storySelect.appendChild(option);
        });
    },

    loadStory(storyId) {
        this.currentStoryId = storyId;
        const story = Stories.getStory(storyId);

        if (!story) {
            this.container.innerHTML = '<p class="tree-error">Could not load story structure.</p>';
            return;
        }

        document.getElementById('tree-view-title').textContent = story.title;
        this.renderHorizontalTree(story);
        this.updateStats(storyId);
    },

    // Build a flat structure organized by depth levels
    buildLevelData(story) {
        const levels = []; // Array of arrays, each inner array is nodes at that depth
        const nodeConnections = []; // Track connections between nodes
        const visited = new Set();
        const nodePositions = new Map(); // nodeId -> { level, index }

        const processNode = (nodeId, depth, parentId, choiceText) => {
            // Ensure we have an array for this depth
            while (levels.length <= depth) {
                levels.push([]);
            }

            const node = story.nodes[nodeId];
            if (!node) return;

            // Check for circular reference
            if (visited.has(nodeId)) {
                // Add a circular reference marker
                const circularNode = {
                    id: nodeId + '-circular-' + depth,
                    isCircular: true,
                    targetId: nodeId,
                    summary: `↩ Back to earlier choice`
                };
                const index = levels[depth].length;
                levels[depth].push(circularNode);
                nodePositions.set(circularNode.id, { level: depth, index });

                if (parentId) {
                    nodeConnections.push({
                        from: parentId,
                        to: circularNode.id,
                        choiceText
                    });
                }
                return;
            }

            visited.add(nodeId);

            // Add node to its level
            const index = levels[depth].length;
            levels[depth].push(node);
            nodePositions.set(nodeId, { level: depth, index });

            // Add connection from parent
            if (parentId) {
                nodeConnections.push({
                    from: parentId,
                    to: nodeId,
                    choiceText
                });
            }

            // Process children
            if (node.choices && node.choices.length > 0) {
                node.choices.forEach(choice => {
                    const nextId = choice.nextNodeId || choice.next;
                    if (nextId) {
                        processNode(nextId, depth + 1, nodeId, choice.text);
                    }
                });
            }
        };

        // Start from the root
        processNode(story.startNode, 0, null, null);

        return { levels, nodeConnections, nodePositions };
    },

    renderHorizontalTree(story) {
        this.container.innerHTML = '';

        // Create a list-based view where each node shows its choices inline
        const treeElement = document.createElement('div');
        treeElement.className = 'story-tree-list';

        // Render nodes in reading order (BFS from start)
        const visited = new Set();
        const queue = [story.startNode];
        const nodeOrder = [];

        while (queue.length > 0) {
            const nodeId = queue.shift();
            if (visited.has(nodeId)) continue;
            visited.add(nodeId);

            const node = story.nodes[nodeId];
            if (!node) continue;

            nodeOrder.push(node);

            // Add children to queue
            if (node.choices && node.choices.length > 0) {
                node.choices.forEach(choice => {
                    const nextId = choice.nextNodeId || choice.next;
                    if (nextId && !visited.has(nextId)) {
                        queue.push(nextId);
                    }
                });
            }
        }

        // Render each node with its choices
        nodeOrder.forEach((node, index) => {
            const nodeEl = this.createExpandedNodeElement(node, story, index);
            treeElement.appendChild(nodeEl);
        });

        this.container.appendChild(treeElement);
    },

    createExpandedNodeElement(node, story, index) {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'tree-node-expanded';
        nodeEl.dataset.nodeId = node.id;

        // Determine node type
        if (node.isEnding) {
            nodeEl.classList.add('ending', node.endingType || 'neutral');
        }

        // Build the node content
        const endingBadge = node.isEnding
            ? `<span class="node-ending-badge ${node.endingType || 'neutral'}">${
                node.endingType === 'good' ? '🌟 Good Ending' :
                node.endingType === 'bad' ? '💔 Bad Ending' : '⚖️ Neutral Ending'
            }</span>`
            : '';

        const nodeNumber = index + 1;
        const emoji = node.emoji || '📄';
        const summary = this.escapeHtml(node.summary || node.id);

        // Build choices HTML
        let choicesHtml = '';
        if (node.choices && node.choices.length > 0) {
            const choiceItems = node.choices.map(choice => {
                const nextId = choice.nextNodeId || choice.next;
                const nextNode = story.nodes[nextId];
                const nextSummary = nextNode ? (nextNode.summary || nextId) : nextId;
                const nextEmoji = nextNode?.emoji || '📄';

                // Check if destination is an ending
                let endingIndicator = '';
                if (nextNode?.isEnding) {
                    if (nextNode.endingType === 'good') endingIndicator = ' <span class="choice-ending-indicator good">🌟</span>';
                    else if (nextNode.endingType === 'bad') endingIndicator = ' <span class="choice-ending-indicator bad">💔</span>';
                    else endingIndicator = ' <span class="choice-ending-indicator neutral">⚖️</span>';
                }

                return `
                    <div class="tree-choice-row">
                        <span class="choice-arrow">→</span>
                        <span class="choice-text">"${this.escapeHtml(choice.text)}"</span>
                        <span class="choice-leads-to">leads to</span>
                        <span class="choice-destination">
                            <span class="dest-emoji">${nextEmoji}</span>
                            <span class="dest-summary">${this.escapeHtml(nextSummary)}</span>
                            ${endingIndicator}
                        </span>
                    </div>
                `;
            }).join('');

            choicesHtml = `<div class="tree-choices-list">${choiceItems}</div>`;
        }

        nodeEl.innerHTML = `
            <div class="node-header">
                <span class="node-number">#${nodeNumber}</span>
                <span class="node-emoji-large">${emoji}</span>
                <span class="node-summary-text">${summary}</span>
                ${endingBadge}
            </div>
            ${choicesHtml}
        `;

        return nodeEl;
    },

    createNodeElement(node, level, index) {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'tree-node-h';
        nodeEl.dataset.nodeId = node.id;
        nodeEl.dataset.level = level;
        nodeEl.dataset.index = index;

        if (node.isCircular) {
            nodeEl.classList.add('circular');
            nodeEl.innerHTML = `
                <span class="node-emoji">🔄</span>
                <span class="node-summary">${this.escapeHtml(node.summary)}</span>
            `;
            return nodeEl;
        }

        // Determine ending type
        if (node.isEnding) {
            nodeEl.classList.add('ending', node.endingType || 'neutral');
        }

        const endingIcon = node.isEnding
            ? (node.endingType === 'good' ? '🌟' : node.endingType === 'bad' ? '💔' : '⚖️')
            : '';

        nodeEl.innerHTML = `
            <span class="node-emoji">${node.emoji || '📄'}</span>
            <span class="node-summary">${this.escapeHtml(node.summary || node.id)}</span>
            ${node.isEnding ? `<span class="ending-icon">${endingIcon}</span>` : ''}
        `;

        // Add tooltip with choice text on hover
        nodeEl.title = node.summary || node.id;

        return nodeEl;
    },


    updateStats(storyId) {
        const story = Stories.getStory(storyId);
        if (!story) return;

        const stats = Stories.getStoryStats(story);
        const statsEl = document.getElementById('tree-view-stats');

        const contentNotes = story.contentNotes && story.contentNotes.length > 0
            ? `<br><strong>Content Notes:</strong> ${story.contentNotes.join(', ')}`
            : '';

        statsEl.innerHTML = `
            <strong>${stats.totalNodes}</strong> story moments &nbsp;|&nbsp;
            <strong>${stats.totalEndings}</strong> endings (${stats.goodEndings} good)
            ${story.estimatedMinutes ? `&nbsp;|&nbsp; <strong>~${story.estimatedMinutes} min</strong>` : ''}
            ${story.ageRange ? `&nbsp;|&nbsp; Ages <strong>${story.ageRange}</strong>` : ''}
            ${contentNotes}
        `;
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    TreeView.init();
});
