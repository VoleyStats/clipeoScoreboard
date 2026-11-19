import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { backdropIn, popIn } from '../motion';
import { t } from '../i18n';
import { C, F } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Botones al pie del popup */
  footer?: ReactNode;
  maxWidth?: number;
}

/** Ventana emergente centrada sobre el marcador. */
export function Popup({ visible, title, onClose, children, footer, maxWidth = 520 }: Props) {
  const { height } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <Animated.View entering={backdropIn} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t.close} />
        <Animated.View entering={popIn} style={[styles.card, { maxWidth, maxHeight: height - 40 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.close} accessibilityLabel={t.close}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(7,10,18,0.7)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: C.bg, borderRadius: 20, width: '100%', overflow: 'hidden', borderWidth: 1, borderColor: C.line },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  title: { color: C.text, fontSize: 22, fontFamily: F.display },
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.line, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: C.text, fontSize: 14, fontFamily: F.bold },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  footer: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: C.line, justifyContent: 'flex-end' },
});
