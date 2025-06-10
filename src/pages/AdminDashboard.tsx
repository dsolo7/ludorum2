import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import Dashboard from '../components/admin/Dashboard';
import AIModels from '../components/admin/AIModels';
import Users from '../components/admin/Users';
import AuditLogs from '../components/admin/AuditLogs';
import Settings from '../components/admin/Settings';
import CreateAnalyzer from '../components/admin/CreateAnalyzer';
import ModelBuilder from '../components/admin/ModelBuilder';
import LLMProviders from '../components/admin/LLMProviders';
import BetTypes from '../components/admin/BetTypes';
import Sports from '../components/admin/Sports';
import APIFeeds from '../components/admin/APIFeeds';
import Tokenize from '../components/admin/Tokenize';
import UserTokens from '../components/admin/UserTokens';
import TokenTransactions from '../components/admin/TokenTransactions';
import Analyzer from '../components/admin/Analyzer';
import Ads from '../components/admin/Ads';
import AdPlacements from '../components/admin/AdPlacements';
import GamificationOverview from '../components/admin/GamificationOverview';
import Leaderboard from '../components/admin/Leaderboard';
import BadgeDefinitions from '../components/admin/BadgeDefinitions';
import ContestManagement from '../components/admin/ContestManagement';
import PageBuilder from '../components/admin/PageBuilder';

const AdminDashboard: React.FC = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="models" element={<AIModels />} />
        <Route path="models/create" element={<CreateAnalyzer />} />
        <Route path="model-builder" element={<ModelBuilder />} />
        <Route path="llm-providers" element={<LLMProviders />} />
        <Route path="bet-types" element={<BetTypes />} />
        <Route path="sports" element={<Sports />} />
        <Route path="api-feeds" element={<APIFeeds />} />
        <Route path="tokenize" element={<Tokenize />} />
        <Route path="user-tokens" element={<UserTokens />} />
        <Route path="token-transactions" element={<TokenTransactions />} />
        <Route path="analyzer" element={<Analyzer />} />
        <Route path="ads" element={<Ads />} />
        <Route path="ad-placements" element={<AdPlacements />} />
        <Route path="gamification" element={<GamificationOverview />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="badge-definitions" element={<BadgeDefinitions />} />
        <Route path="contest-management" element={<ContestManagement />} />
        <Route path="page-builder" element={<PageBuilder />} />
        <Route path="users" element={<Users />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/admin\" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;