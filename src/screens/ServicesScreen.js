import React from 'react';
import PreviewStateScreen from '../components/PreviewStateScreen';

export default function ServicesScreen({ navigation }) {
  return <PreviewStateScreen navigation={navigation} icon="briefcase-outline" titleKey="gate1.services.title" bodyKey="gate1.services.body" />;
}
