import React from 'react';
import PreviewStateScreen from '../components/PreviewStateScreen';

export default function JobsScreen({ navigation }) {
  return <PreviewStateScreen navigation={navigation} icon="briefcase-outline" titleKey="gate1.jobs.title" bodyKey="gate1.jobs.body" />;
}
