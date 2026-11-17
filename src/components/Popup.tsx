import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { C } from './ui';

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />
        <View style={[styles.card, { maxWidth, maxHeight: height - 40 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.close} accessibilityLabel="Cerrar">
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: C.bg, borderRadius: 20, width: '100%', overflow: 'hidden', borderWidth: 1, borderColor: C.line },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  title: { color: C.text, fontSize: 20, fontWeight: '800' },
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.line, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: C.text, fontSize: 14, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  footer: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: C.line, justifyContent: 'flex-end' },
});
