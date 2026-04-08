import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ActionButton } from '../../components/ui';
import type { QuizSessionDetail, QuizSessionResult } from '../../types';
import { styles } from '../../theme/styles';

export function SessionRoom({
  session,
  result,
  loading,
  currentQuestionIndex,
  currentParticipantSeat,
  currentParticipantId,
  selectableWords,
  extraWords,
  selectedOrder,
  onToggleWord,
  onSubmit,
  submitting,
  socketConnected,
  sessionError,
  opponentAlert,
  feed,
}: {
  session: QuizSessionDetail | null;
  result: QuizSessionResult | null;
  loading: boolean;
  currentQuestionIndex: number;
  currentParticipantSeat: string | null;
  currentParticipantId: string | null;
  selectableWords: { word: string; label: string }[];
  extraWords: { word: string; label: string }[];
  selectedOrder: string[];
  onToggleWord: (word: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  socketConnected: boolean;
  sessionError: string | null;
  opponentAlert: string | null;
  feed: { id: string; label: string }[];
}) {
  if (loading && !session && !result) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderCopy}>
            <Text style={styles.cardTitle}>Loading session</Text>
            <Text style={styles.cardSubtitle}>
              Fetching the current quiz, participants, and question state.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (!session && !result) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>No session loaded</Text>
        <Text style={styles.cardSubtitle}>
          Start a session from a quiz preview or join one with a code.
        </Text>
      </View>
    );
  }

  const activeSession = session ?? result?.session ?? null;
  const question = activeSession?.quiz.questions[currentQuestionIndex] ?? null;

  if (result) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderCopy}>
            <Text style={styles.cardTitle}>Session result</Text>
            <Text style={styles.cardSubtitle}>
              Final scores and timing comparison for the completed session.
            </Text>
          </View>
        </View>

        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>Status</Text>
          <Text style={styles.detailValue}>{result.session.status}</Text>
          <Text style={styles.detailLabel}>Participants</Text>
          <Text style={styles.detailValue}>
            {result.participants.map((item) => `${item.seat}: ${item.totalScore}`).join(' · ')}
          </Text>
        </View>

        <View style={styles.list}>
          {result.questions.map((item) => (
            <View key={item.questionId} style={styles.questionItem}>
              <Text style={styles.listItemTitle}>Question {item.questionIndex + 1}</Text>
              <Text style={styles.listItemMeta}>
                First responder: {item.firstResponderParticipantId ?? 'n/a'}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderCopy}>
          <Text style={styles.cardTitle}>Live session</Text>
          <Text style={styles.cardSubtitle}>
            {session.status} · {socketConnected ? 'Live updates on' : 'Connecting...'}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{session.mode}</Text>
        </View>
      </View>

      {sessionError ? <Text style={styles.error}>{sessionError}</Text> : null}
      {opponentAlert ? <Text style={styles.liveNotice}>{opponentAlert}</Text> : null}

      <View style={styles.detailBox}>
        <Text style={styles.detailLabel}>Session code</Text>
        <Text style={styles.detailValue}>{session.joinCode ?? 'Solo session'}</Text>
        <Text style={styles.detailLabel}>Your seat</Text>
        <Text style={styles.detailValue}>{currentParticipantSeat ?? 'n/a'}</Text>
        <Text style={styles.detailLabel}>Current question</Text>
        <Text style={styles.detailValue}>
          {question ? `${currentQuestionIndex + 1}. ${question.description}` : 'No active question'}
        </Text>
      </View>

      {question ? (
        <>
          <View style={styles.optionSummaryRow}>
            {selectedOrder.map((word) => (
              <Pressable
                key={word}
                onPress={() => onToggleWord(word)}
                style={styles.answerChip}
              >
                <Text style={styles.answerChipText}>{word}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.list}>
            {selectableWords.map((option) => (
              <Pressable
                key={`${question.id}-${option.word}`}
                onPress={() => onToggleWord(option.word)}
                style={({ pressed }) => [
                  styles.optionPick,
                  selectedOrder.includes(option.word) && styles.optionPickActive,
                  pressed && styles.listItemPressed,
                ]}
              >
                <Text style={styles.listItemTitle}>{option.word}</Text>
                <Text style={styles.listItemMeta}>{option.label}</Text>
              </Pressable>
            ))}
          </View>

          {extraWords.length > 0 ? (
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Extra words</Text>
              <Text style={styles.detailValue}>
                {extraWords.map((option) => option.word).join(' · ')}
              </Text>
            </View>
          ) : null}

          <View style={styles.sessionActions}>
            <ActionButton
              label={submitting ? 'Submitting...' : 'Submit answer'}
              onPress={onSubmit}
            />
            <Text style={styles.meta}>
              {currentParticipantId ? `Participant ${currentParticipantId}` : 'No participant selected'}
            </Text>
          </View>
        </>
      ) : null}

      <View style={styles.feedBox}>
        <Text style={styles.detailLabel}>Live feed</Text>
        {feed.length === 0 ? (
          <Text style={styles.detailValue}>Waiting for answers...</Text>
        ) : (
          feed.map((item) => (
            <Text key={item.id} style={styles.feedItem}>
              {item.label}
            </Text>
          ))
        )}
      </View>
    </View>
  );
}
