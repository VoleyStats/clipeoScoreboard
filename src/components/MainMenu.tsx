import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from './ui';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCloseSet: () => void;
  onNewMatch: () => void;
  onSwap: () => void;
  onSettings: () => void;
}

/** Submenú pequeño que se despliega sobre el botón ••• */
export function MainMenu({ visible, onClose: closeMenu, onCloseSet, onNewMatch, onSwap, onSettings }: Props) {
  const [confirmMatch, setConfirmMatch] = useState(false);
  const onClose = () => { setConfirmMatch(false); closeMenu(); };

  const item = (label: string, hint: string | null, onPress: () => void, danger = false) => (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
      <Text style={[styles.label, danger && { color: C.danger }]}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.menu} onStartShouldSetResponder={() => true}>
          {item('Reiniciar puntos', 'Suma 1 set al que va ganando', () => { onCloseSet(); onClose(); })}
          {item(
            confirmMatch ? '¿Seguro? Toca otra vez' : 'Nuevo partido',
            confirmMatch ? null : 'Puntos y sets a 0',
            () => (confirmMatch ? (onNewMatch(), onClose()) : setConfirmMatch(true)),
            true,
          )}
          {item('⇄  Cambiar lados', null, () => { onSwap(); onClose(); })}
          <View style={styles.sep} />
          {item('Ajustes', null, () => { onClose(); onSettings(); })}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 54 },
  menu: {
    backgroundColor: C.card, borderRadius: 16, padding: 6, minWidth: 230,
    borderWidth: 1, borderColor: C.line,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  item: { paddingVertical: 11, paddingHorizontal: 14, borderRadius: 10 },
  pressed: { backgroundColor: C.line },
  label: { color: C.text, fontSize: 16, fontWeight: '600' },
  hint: { color: C.muted, fontSize: 12, marginTop: 2 },
  sep: { height: 1, backgroundColor: C.line, marginVertical: 4, marginHorizontal: 8 },
});
