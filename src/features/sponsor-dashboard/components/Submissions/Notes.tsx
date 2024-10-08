import { Flex, HStack, Spinner, Text, Textarea } from '@chakra-ui/react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import React, {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';

import { type SubmissionWithUser } from '@/interface/submission';

const MAX_CHARACTERS = 500;

type Props = {
  submissionId: string;
  initialNotes?: string;
  selectedSubmission: SubmissionWithUser;
  setSelectedSubmission: Dispatch<
    SetStateAction<SubmissionWithUser | undefined>
  >;
  setSubmissions: Dispatch<SetStateAction<SubmissionWithUser[]>>;
};

export const Notes = ({
  submissionId,
  selectedSubmission,
  setSelectedSubmission,
  setSubmissions,
  initialNotes = '',
}: Props) => {
  const [notes, setNotes] = useState(initialNotes || '');
  const [isSaving, setIsSaving] = useState(false);

  const autosave = async (content: string) => {
    setIsSaving(true);
    try {
      await axios.post('/api/sponsor-dashboard/submission/update-notes', {
        id: submissionId,
        notes: content,
      });
    } catch (error) {
      console.error('Error autosaving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const debouncedAutosave = useCallback(
    debounce((content: string) => autosave(content), 1000),
    [submissionId, initialNotes],
  );

  useEffect(() => {
    debouncedAutosave(notes);
    return () => {
      debouncedAutosave.cancel();
    };
  }, [notes, debouncedAutosave]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;

    if (value !== '' && notes === '') {
      value = '• ' + value;
    }

    if (value.length <= MAX_CHARACTERS) {
      setSelectedSubmission({
        ...selectedSubmission,
        notes: value,
      });
      setSubmissions((prevSubmissions) =>
        prevSubmissions.map((submission) =>
          submission.id === submissionId
            ? { ...submission, notes: value }
            : submission,
        ),
      );
      setNotes(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cursorPosition = e.currentTarget.selectionStart;
      const textBeforeCursor = notes.slice(0, cursorPosition);
      const textAfterCursor = notes.slice(cursorPosition);
      setNotes(`${textBeforeCursor}\n• ${textAfterCursor}`);
    } else if (e.key === 'Backspace') {
      const lines = notes.split('\n');
      if (lines[lines.length - 1] === '• ' && lines.length > 1) {
        e.preventDefault();
        setNotes(notes.slice(0, -3));
      }
    }
  };

  return (
    <Flex align="start" direction="column" w="full">
      <HStack justify="space-between" w="full" mb={2} color="brand.slate.400">
        <Text fontWeight={800}>Review Notes</Text>
        {isSaving ? (
          <Spinner size="xs" />
        ) : (
          <Text fontSize="xx-small">Auto-saved</Text>
        )}
      </HStack>
      <Textarea
        key={submissionId}
        sx={{
          lineHeight: '2',
          '& ::placeholder': {
            lineHeight: '2',
          },
        }}
        p={2}
        color="brand.slate.400"
        fontSize={'sm'}
        border="none"
        _placeholder={{ color: 'brand.slate.400' }}
        whiteSpace="pre-wrap"
        resize="vertical"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="• Start typing notes here"
        rows={20}
        value={notes}
      />
      <Text mt={1} color="brand.slate.400" fontSize="xs">
        {MAX_CHARACTERS - notes.length} characters remaining
      </Text>
    </Flex>
  );
};
