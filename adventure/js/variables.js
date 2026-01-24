// Variable Substitution System
// Handles replacing placeholders like {{PLAYER1_NAME}} with actual values

const Variables = {
    // Pronoun mappings for he/she/they
    pronouns: {
        he: {
            subject: 'he',
            object: 'him',
            possessive: 'his',
            reflexive: 'himself',
            subjectCap: 'He',
            objectCap: 'Him',
            possessiveCap: 'His'
        },
        she: {
            subject: 'she',
            object: 'her',
            possessive: 'her',
            reflexive: 'herself',
            subjectCap: 'She',
            objectCap: 'Her',
            possessiveCap: 'Her'
        },
        they: {
            subject: 'they',
            object: 'them',
            possessive: 'their',
            reflexive: 'themself',
            subjectCap: 'They',
            objectCap: 'Them',
            possessiveCap: 'Their'
        }
    },

    // Get all variable values based on stored player data
    getValues() {
        const players = Storage.getPlayers();
        if (!players) return {};

        const p1 = players.player1;
        const p2 = players.player2;

        const p1Pro = this.pronouns[p1.pronoun] || this.pronouns.they;
        const p2Pro = this.pronouns[p2.pronoun] || this.pronouns.they;

        return {
            // Player 1
            'PLAYER1_NAME': p1.name,
            'PLAYER1_HE_SHE': p1Pro.subject,
            'PLAYER1_HIM_HER': p1Pro.object,
            'PLAYER1_HIS_HER': p1Pro.possessive,
            'PLAYER1_HIMSELF_HERSELF': p1Pro.reflexive,
            'PLAYER1_HE_SHE_CAP': p1Pro.subjectCap,
            'PLAYER1_HIM_HER_CAP': p1Pro.objectCap,
            'PLAYER1_HIS_HER_CAP': p1Pro.possessiveCap,
            // Gendered nouns (use neutral for they/them)
            'PLAYER1_BOY_GIRL': p1.pronoun === 'he' ? 'boy' : p1.pronoun === 'she' ? 'girl' : 'kid',
            'PLAYER1_BROTHER_SISTER': p1.pronoun === 'he' ? 'brother' : p1.pronoun === 'she' ? 'sister' : 'sibling',
            'PLAYER1_PRINCE_PRINCESS': p1.pronoun === 'he' ? 'prince' : p1.pronoun === 'she' ? 'princess' : 'royal',
            'PLAYER1_KING_QUEEN': p1.pronoun === 'he' ? 'king' : p1.pronoun === 'she' ? 'queen' : 'ruler',
            'PLAYER1_SON_DAUGHTER': p1.pronoun === 'he' ? 'son' : p1.pronoun === 'she' ? 'daughter' : 'child',

            // Player 2
            'PLAYER2_NAME': p2.name,
            'PLAYER2_HE_SHE': p2Pro.subject,
            'PLAYER2_HIM_HER': p2Pro.object,
            'PLAYER2_HIS_HER': p2Pro.possessive,
            'PLAYER2_HIMSELF_HERSELF': p2Pro.reflexive,
            'PLAYER2_HE_SHE_CAP': p2Pro.subjectCap,
            'PLAYER2_HIM_HER_CAP': p2Pro.objectCap,
            'PLAYER2_HIS_HER_CAP': p2Pro.possessiveCap,
            // Gendered nouns
            'PLAYER2_BOY_GIRL': p2.pronoun === 'he' ? 'boy' : p2.pronoun === 'she' ? 'girl' : 'kid',
            'PLAYER2_BROTHER_SISTER': p2.pronoun === 'he' ? 'brother' : p2.pronoun === 'she' ? 'sister' : 'sibling',
            'PLAYER2_PRINCE_PRINCESS': p2.pronoun === 'he' ? 'prince' : p2.pronoun === 'she' ? 'princess' : 'royal',
            'PLAYER2_KING_QUEEN': p2.pronoun === 'he' ? 'king' : p2.pronoun === 'she' ? 'queen' : 'ruler',
            'PLAYER2_SON_DAUGHTER': p2.pronoun === 'he' ? 'son' : p2.pronoun === 'she' ? 'daughter' : 'child',

            // Combined
            'BOTH_NAMES': `${p1.name} and ${p2.name}`,
            'THEY': 'they',
            'THEM': 'them',
            'THEIR': 'their'
        };
    },

    // Replace all {{VARIABLE}} placeholders in text
    substitute(text) {
        if (!text) return text;

        const values = this.getValues();
        let result = text;

        // Replace all {{VARIABLE}} patterns
        result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
            return values[varName] !== undefined ? values[varName] : match;
        });

        return result;
    },

    // Substitute variables in an entire story node
    substituteNode(node) {
        if (!node) return node;

        return {
            ...node,
            text: this.substitute(node.text),
            choices: node.choices ? node.choices.map(choice => ({
                ...choice,
                text: this.substitute(choice.text)
            })) : []
        };
    },

    // Substitute variables in story metadata
    substituteStoryMeta(story) {
        if (!story) return story;

        return {
            ...story,
            title: this.substitute(story.title),
            description: this.substitute(story.description)
        };
    }
};
