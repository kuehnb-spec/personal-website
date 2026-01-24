# Adventure Story Format Specification

**Version:** 1.0
**File Extension:** `.adventure`
**MIME Type:** `application/x-adventure+json`

## Overview

The `.adventure` format is a JSON-based file format for interactive choose-your-own-adventure stories. It supports branching narratives, variable substitution for personalization, and metadata for both readers and parents.

## File Structure

```json
{
  "formatVersion": "1.0",
  "metadata": { ... },
  "nodes": { ... }
}
```

## Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `formatVersion` | string | Yes | Schema version (e.g., "1.0") |
| `metadata` | object | Yes | Story metadata and configuration |
| `nodes` | object | Yes | Map of node IDs to node objects |

## Metadata Object

```json
{
  "metadata": {
    "id": "unique-story-id",
    "title": "Story Title",
    "author": "Author Name",
    "createdAt": "2025-01-22T12:00:00Z",
    "updatedAt": "2025-01-22T12:00:00Z",
    "coverEmoji": "🐉",
    "coverImage": "cover.png",
    "description": "Brief story description with {{VARIABLE}} support",
    "ageRange": "8-10",
    "estimatedMinutes": 15,
    "themes": ["adventure", "fantasy"],
    "contentNotes": ["mild peril"],
    "startNode": "start"
  }
}
```

### Metadata Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (kebab-case recommended) |
| `title` | string | Yes | Display title |
| `author` | string | Yes | Author or creator name |
| `createdAt` | string | No | ISO 8601 creation timestamp |
| `updatedAt` | string | No | ISO 8601 last modified timestamp |
| `coverEmoji` | string | No | Emoji for story card (fallback if no image) |
| `coverImage` | string | No | Path to cover image file |
| `description` | string | Yes | Story description (supports variables) |
| `ageRange` | string | No | Target age range (e.g., "8-10") |
| `estimatedMinutes` | number | No | Estimated play time in minutes |
| `themes` | array | No | List of theme tags |
| `contentNotes` | array | No | Content warnings for parents |
| `startNode` | string | Yes | ID of the first node |

## Node Object

```json
{
  "node-id": {
    "id": "node-id",
    "summary": "Short description for parent tree view",
    "text": "Full story text with {{VARIABLES}}...",
    "emoji": "🚪",
    "image": "scene.png",
    "choices": [ ... ],
    "isEnding": false,
    "endingType": "good",
    "endingText": "Epilogue text..."
  }
}
```

### Node Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique node identifier |
| `summary` | string | Yes | Short (5-15 word) summary for parent view |
| `text` | string | Yes | Full story text (supports variables) |
| `emoji` | string | No | Emoji icon for this scene |
| `image` | string | No | Path to scene image |
| `choices` | array | Yes* | Array of choice objects (*empty for endings) |
| `isEnding` | boolean | No | True if this is an ending node |
| `endingType` | string | No | "good", "neutral", or "bad" |
| `endingText` | string | No | Additional epilogue text for endings |

## Choice Object

```json
{
  "text": "Choice button text",
  "nextNodeId": "target-node-id"
}
```

### Choice Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | Yes | Button text (supports variables) |
| `nextNodeId` | string | Yes | ID of the node this choice leads to |

## Variable Substitution

Story text, descriptions, and choice text support variable placeholders using `{{VARIABLE_NAME}}` syntax.

### Available Variables

**Player 1:**
- `{{PLAYER1_NAME}}` - First player's name
- `{{PLAYER1_HE_SHE}}` - Subject pronoun (he/she/they)
- `{{PLAYER1_HIM_HER}}` - Object pronoun (him/her/them)
- `{{PLAYER1_HIS_HER}}` - Possessive pronoun (his/her/their)
- `{{PLAYER1_HIMSELF_HERSELF}}` - Reflexive (himself/herself/themself)
- `{{PLAYER1_HE_SHE_CAP}}` - Capitalized subject pronoun
- `{{PLAYER1_BOY_GIRL}}` - Gendered noun (boy/girl/kid)
- `{{PLAYER1_BROTHER_SISTER}}` - (brother/sister/sibling)
- `{{PLAYER1_PRINCE_PRINCESS}}` - (prince/princess/royal)

**Player 2:** Same pattern with `PLAYER2_` prefix

**Combined:**
- `{{BOTH_NAMES}}` - "Player1 and Player2"
- `{{THEY}}` - "they" (for referring to both)
- `{{THEM}}` - "them"
- `{{THEIR}}` - "their"

## Example

```json
{
  "formatVersion": "1.0",
  "metadata": {
    "id": "dragon-cave",
    "title": "The Dragon's Cave",
    "author": "Adventure Stories",
    "coverEmoji": "🐉",
    "description": "{{BOTH_NAMES}} discover a mysterious cave...",
    "ageRange": "8-10",
    "estimatedMinutes": 10,
    "themes": ["fantasy", "adventure", "friendship"],
    "contentNotes": [],
    "startNode": "start"
  },
  "nodes": {
    "start": {
      "id": "start",
      "summary": "The kids find a mysterious cave entrance",
      "text": "{{PLAYER1_NAME}} and {{PLAYER2_NAME}} stand at the entrance...",
      "emoji": "🚪",
      "choices": [
        { "text": "Enter the cave", "nextNodeId": "enter-cave" },
        { "text": "Look around first", "nextNodeId": "look-around" }
      ]
    },
    "the-end": {
      "id": "the-end",
      "summary": "The adventure concludes happily",
      "text": "They emerge victorious...",
      "emoji": "🌟",
      "choices": [],
      "isEnding": true,
      "endingType": "good",
      "endingText": "THE END - You saved the day!"
    }
  }
}
```

## File Naming Convention

- Use kebab-case: `dragon-cave.adventure`
- Match the metadata `id` field
- Store in a `stories/` directory

## Validation

Stories should be validated on load for:
1. Valid JSON syntax
2. Required fields present
3. All `nextNodeId` references point to existing nodes
4. At least one ending node exists
5. Start node exists
