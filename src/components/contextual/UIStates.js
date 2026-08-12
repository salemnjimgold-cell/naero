import React from 'react';
import { useTranslation } from 'react-i18next';
import StateView, { InlineLoading } from './StateView';

export { InlineLoading };

export function EmptyState({ kind = 'generic', primaryAction, secondaryAction }) {
  const { t } = useTranslation();
  return <StateView icon={kind === 'notifications' ? 'notifications-off-outline' : kind === 'saved' ? 'bookmark-outline' : 'file-tray-outline'} title={t(`contextual.states.empty.${kind}.title`, { defaultValue: t('contextual.states.empty.generic.title') })} body={t(`contextual.states.empty.${kind}.body`, { defaultValue: t('contextual.states.empty.generic.body') })} primaryAction={primaryAction} secondaryAction={secondaryAction} />;
}

export function ErrorState({ kind = 'unknown', referenceId, onRetry }) {
  const { t } = useTranslation(); const retryable = ['network', 'service', 'unknown'].includes(kind) && Boolean(onRetry);
  const reference = referenceId ? t('contextual.states.error.reference', { id: referenceId }) : null;
  return <StateView icon={kind === 'permission' ? 'lock-closed-outline' : 'alert-circle-outline'} tone={kind === 'invalid_data' ? 'warning' : 'danger'} title={t(`contextual.states.error.${kind}.title`, { defaultValue: t('contextual.states.error.unknown.title') })} body={[t(`contextual.states.error.${kind}.body`, { defaultValue: t('contextual.states.error.unknown.body') }), reference].filter(Boolean).join('\n')} primaryAction={retryable ? { label: t('common.retry'), onPress: onRetry } : null} />;
}

export function OfflineState({ cached = false, stale = false, onRetry }) {
  const { t } = useTranslation(); const key = stale ? 'staleCache' : cached ? 'cached' : 'offline';
  return <StateView icon="cloud-offline-outline" tone="warning" title={t(`contextual.states.offline.${key}.title`)} body={t(`contextual.states.offline.${key}.body`)} primaryAction={onRetry ? { label: t('common.retry'), onPress: onRetry } : null} />;
}

export function PermissionState({ permission = 'location', onRequest, alternativeAction }) {
  const { t } = useTranslation();
  return <StateView icon="lock-closed-outline" title={t(`contextual.states.permission.${permission}.title`, { defaultValue: t('contextual.states.permission.other.title') })} body={t(`contextual.states.permission.${permission}.body`, { defaultValue: t('contextual.states.permission.other.body') })} primaryAction={onRequest ? { label: t(`contextual.states.permission.${permission}.action`, { defaultValue: t('contextual.states.permission.other.action') }), onPress: onRequest } : null} secondaryAction={alternativeAction} />;
}

export function LocationOffState({ onEnable, onChooseCity }) {
  const { t } = useTranslation();
  return <StateView icon="location-outline" title={t('contextual.states.locationOff.title')} body={t('contextual.states.locationOff.body')} primaryAction={onEnable ? { label: t('contextual.states.locationOff.enable'), onPress: onEnable } : null} secondaryAction={onChooseCity ? { label: t('contextual.states.locationOff.chooseCity'), onPress: onChooseCity } : null} />;
}

export function StaleInformationState({ freshness = 'outdated', checkedDate, onSource, onRefresh }) {
  const { t } = useTranslation(); const dateText = checkedDate ? t('contextual.states.stale.checked', { date: checkedDate }) : t('contextual.states.stale.unknownDate');
  return <StateView icon="time-outline" tone="warning" title={t(`contextual.states.stale.${freshness}.title`, { defaultValue: t('contextual.states.stale.outdated.title') })} body={`${t(`contextual.states.stale.${freshness}.body`, { defaultValue: t('contextual.states.stale.outdated.body') })} ${dateText}`} primaryAction={onSource ? { label: t('contextual.states.stale.viewSource'), onPress: onSource } : null} secondaryAction={onRefresh ? { label: t('contextual.states.stale.checkUpdates'), onPress: onRefresh } : null} />;
}

export function UnsupportedJurisdictionState({ onDiscover }) {
  const { t } = useTranslation();
  return <StateView icon="map-outline" tone="info" title={t('contextual.states.unsupported.title')} body={t('contextual.states.unsupported.body')} primaryAction={onDiscover ? { label: t('contextual.states.unsupported.discover'), onPress: onDiscover } : null} />;
}
