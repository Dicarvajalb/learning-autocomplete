import type { JSONSchemaType } from 'ajv';
import {
  type CreateQuestionInput,
  type CreateQuizInput,
  type CreateQuizSessionInput,
  type JoinQuizSessionInput,
  type QuizQuestion,
  type QuizQuestionInput,
  type SubmitQuizSessionAnswerInput,
  type UpdateQuestionInput,
  type UpdateQuizInput,
} from './entities';

type QuizQuestionOptionInput = QuizQuestion['options'][number];

type QuizQuestionBodyOptionInput = QuizQuestionInput['options'][number];

export const quizQuestionOptionSchema: JSONSchemaType<QuizQuestionOptionInput> =
  {
    type: 'object',
    additionalProperties: false,
    required: ['word', 'label'],
    properties: {
      word: {
        type: 'string',
        minLength: 1,
      },
      label: {
        type: 'string',
        enum: ['HIDE', 'SHOW', 'EXTRA'],
      },
    },
  };

export const quizQuestionSchema: JSONSchemaType<QuizQuestion> = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'description', 'type', 'options'],
  properties: {
    id: {
      type: 'string',
      minLength: 1,
    },
    description: {
      type: 'string',
      minLength: 1,
    },
    type: {
      type: 'string',
      const: 'AUTOCOMPLETE_ORDER',
    },
    options: {
      type: 'array',
      minItems: 1,
      items: quizQuestionOptionSchema,
    },
  },
};

export const quizQuestionBodyOptionSchema: JSONSchemaType<QuizQuestionBodyOptionInput> =
  quizQuestionOptionSchema;

export const quizQuestionBodySchema: JSONSchemaType<QuizQuestionInput> = {
  type: 'object',
  additionalProperties: false,
  required: ['description', 'type', 'options'],
  properties: {
    description: {
      type: 'string',
      minLength: 1,
    },
    type: {
      type: 'string',
      const: 'AUTOCOMPLETE_ORDER',
    },
    options: {
      type: 'array',
      minItems: 1,
      items: quizQuestionBodyOptionSchema,
    },
  },
};

const quizWriteSchemaBase = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'topic', 'difficulty'],
  properties: {
    title: {
      type: 'string',
      minLength: 1,
    },
    topic: {
      type: 'string',
      minLength: 1,
    },
    difficulty: {
      type: 'string',
      enum: ['EASY', 'MEDIUM', 'HARD'],
    },
    description: {
      type: 'string',
      nullable: true,
    },
  },
} as const;

export const createQuizSchema: JSONSchemaType<CreateQuizInput> =
  quizWriteSchemaBase;
export const updateQuizSchema: JSONSchemaType<UpdateQuizInput> =
  quizWriteSchemaBase;
export const createQuestionSchema: JSONSchemaType<CreateQuestionInput> =
  quizQuestionBodySchema;
export const updateQuestionSchema: JSONSchemaType<UpdateQuestionInput> =
  quizQuestionBodySchema;

export const createQuizSessionSchema: JSONSchemaType<CreateQuizSessionInput> = {
  type: 'object',
  additionalProperties: false,
  required: ['mode'],
  properties: {
    mode: {
      type: 'string',
      enum: ['SOLO', 'TWO_PLAYER'],
    },
    participantUserId: {
      type: 'string',
      nullable: true,
    },
  },
};

export const joinQuizSessionSchema: JSONSchemaType<JoinQuizSessionInput> = {
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {
    participantUserId: {
      type: 'string',
      nullable: true,
    },
  },
};

export const submitQuizSessionAnswerSchema: JSONSchemaType<SubmitQuizSessionAnswerInput> =
  {
    type: 'object',
    additionalProperties: false,
    required: ['participantId', 'questionId', 'selectedOrder'],
    properties: {
      participantId: {
        type: 'string',
        minLength: 1,
      },
      questionId: {
        type: 'string',
        minLength: 1,
      },
      selectedOrder: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'string',
          minLength: 1,
        },
      },
    },
  };
