import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { C, F } from '../theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface Props {
  visible: boolean;
  onClose: () => void;
  onCloseSet: () => void;
  onNewMatch: () => void;
  onSwap: () => void;
  onSettings: () => void;
}

/** Fila horizontal de iconos que se despliega sobre el botón ••• */
export function MainMenu({ visible, onClose: closeMenu, onCloseSet, onNewMatch, onSwap, onSettings }: Props) {
  const [confirmMatch, setConfirmMatch] = useState(false);
  const onClose = () => { setConfirmMatch(false); closeMenu(); };

  const item = (icon: IconName, label: string, onPress: () => void, tone: 'default' | 'danger' = 'default') => (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      {...({ title: label } as object)}
      style={({ pressed }) => [styles.item, tone === 'danger' && styles.danger, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={24} color={tone === 'danger' ? C.onBrand : C.text} />
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {confirmMatch && <Text style={styles.confirm}>Toca otra vez para empezar un partido nuevo</Text>}
        <View style={styles.bar} onStartShouldSetResponder={() => true}>
          {item('refresh', 'Reiniciar puntos (suma 1 set al que va ganando)', () => { onCloseSet(); onClose(); })}
          {item(
            confirmMatch ? 'checkmark' : 'trash-outline',
            confirmMatch ? 'Confirmar nuevo partido' : 'Nuevo partido',
            () => (confirmMatch ? (onNewMatch(), onClose()) : setConfirmMatch(true)),
            confirmMatch ? 'danger' : 'default',
          )}
          {item('swap-horizontal', 'Cambiar lados', () => { onSwap(); onClose(); })}
          {item('settings-outline', 'Ajustes', () => { onClose(); onSettings(); })}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(7,10,18,0.45)', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 56 },
  bar: {
    flexDirection: 'row', gap: 4, padding: 6, borderRadius: 999,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.line,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  item: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: C.raised },
  danger: { backgroundColor: C.danger },
  confirm: {
    color: C.text, fontFamily: F.medium, fontSize: 13, marginBottom: 10,
    backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, overflow: 'hidden',
  },
});
