import React from 'react';
import { Text, View } from 'react-native';
import type { QuizDetail } from '../../types';
import { ActionButton, Section } from '../../components/ui';
import { styles } from '../../theme/styles';

export function QuizPreview({
  quiz,
  onOpenAdmin,
  onStartSolo,
  onStartTwoPlayer,
  onJoinSession,
}: {
  quiz: QuizDetail;
  onOpenAdmin: () => void;
  onStartSolo?: () => void;
  onStartTwoPlayer?: () => void;
  onJoinSession?: () => void;
}) {
  return (
    <Section
      title="Quiz preview"
      subtitle="Public quiz details loaded from the backend."
      action={
        <ActionButton
          label="Open in admin"
          onPress={onOpenAdmin}
          variant="ghost"
        />
      }
    >
      <View style={styles.detailBox}>
        <Text style={styles.detailLabel}>Title</Text>
        <Text style={styles.detailValue}>{quiz.title}</Text>
        <Text style={styles.detailLabel}>Topic</Text>
        <Text style={styles.detailValue}>{quiz.topic}</Text>
        <Text style={styles.detailLabel}>Difficulty</Text>
        <Text style={styles.detailValue}>{quiz.difficulty}</Text>
        {quiz.description ? (
          <>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>{quiz.description}</Text>
          </>
        ) : null}
      </View>

      <View style={styles.heroButtons}>
        {onStartSolo ? (
          <ActionButton label="Play solo" onPress={onStartSolo} />
        ) : null}
        {onStartTwoPlayer ? (
          <ActionButton
            label="Play two-player"
            onPress={onStartTwoPlayer}
            variant="secondary"
          />
        ) : null}
        {onJoinSession ? (
          <ActionButton
            label="Join session"
            onPress={onJoinSession}
            variant="ghost"
          />
        ) : null}
      </View>

      <View style={styles.list}>
        {quiz.questions.map((question, index) => (
          <View key={question.id} style={styles.questionItem}>
            <View style={styles.listItemHeader}>
              <View style={styles.listItemCopy}>
                <Text style={styles.listItemTitle}>
                  {index + 1}. {question.description}
                </Text>
                <Text style={styles.listItemMeta}>
                  {question.type} · {question.options.length} options
                </Text>
              </View>
            </View>
            <View style={styles.list}>
              {question.options.map((option) => (
                <View
                  key={`${question.id}-${option.word}-${option.label}`}
                  style={styles.optionChipRow}
                >
                  <Text style={styles.optionWord}>{option.word}</Text>
                  <Text style={styles.badge}>{option.label}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </Section>
  );
}
