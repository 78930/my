import React from 'react';
import { KeyboardTypeOptions, ReturnKeyTypeOptions, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../constants/colors';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: ReturnKeyTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  editable?: boolean;
  testID?: string;
};

export function InputField({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType,
  returnKeyType = 'done',
  autoCapitalize = 'sentences',
  autoCorrect = false,
  editable = true,
  testID,
}: Props) {
  return (
    <View style={[styles.wrap, !editable && styles.wrapDisabled]}>
      <Ionicons name={icon} size={17} color={colors.textMuted} />
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        editable={editable}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#f8fafc',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    minHeight: 50,
  },
  wrapDisabled: {
    opacity: 0.6,
    backgroundColor: '#f1f5f9',
  },
  input: {
    flex: 1,
    color: colors.text,
    paddingVertical: 13,
    fontSize: 14,
  },
});
