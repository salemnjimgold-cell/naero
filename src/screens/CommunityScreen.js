import React from 'react';
import PreviewStateScreen from '../components/PreviewStateScreen';

export default function CommunityScreen({ navigation }) {
  return <PreviewStateScreen navigation={navigation} icon="people-outline" titleKey="gate1.community.title" bodyKey="gate1.community.body" />;
}
