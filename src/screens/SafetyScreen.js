import React from 'react';
import PreviewStateScreen from '../components/PreviewStateScreen';

export default function SafetyScreen({ navigation }) {
  return <PreviewStateScreen navigation={navigation} icon="shield-checkmark-outline" titleKey="gate1.safety.title" bodyKey="gate1.safety.body" />;
}
