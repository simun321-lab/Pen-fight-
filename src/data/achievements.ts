/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AchievementDef } from '../types/multiplayer';

export const ACHIEVEMENTS_CATALOG: AchievementDef[] = [
  {
    id: 'first_online_match',
    title: 'Classroom Debut',
    titleBn: 'ক্লাসরুমের প্রথম লড়াই',
    description: 'Play your first verified online multiplayer match.',
    descriptionBn: 'অনলাইনে আপনার প্রথম ভেরিফাইড ম্যাচ খেলুন।',
    icon: '🎒',
    xpReward: 50,
  },
  {
    id: 'first_victory',
    title: 'First Blood',
    titleBn: 'প্রথম জয়',
    description: 'Win your first online duel or 3-player match.',
    descriptionBn: 'অনলাইনে প্রথমবার জয়লাভ করুন।',
    icon: '🏆',
    xpReward: 75,
  },
  {
    id: 'ten_online_matches',
    title: 'Desk Regular',
    titleBn: 'ডেস্কের নিয়মিত খেলোয়াড়',
    description: 'Complete 10 online multiplayer battles.',
    descriptionBn: 'অনলাইনে ১০টি ম্যাচ সম্পন্ন করুন।',
    icon: '📚',
    xpReward: 120,
  },
  {
    id: 'five_streak',
    title: 'Unstoppable Streak',
    titleBn: 'অপরাজেয় ধারাবাহিকতা',
    description: 'Achieve a 5-win streak in online play.',
    descriptionBn: 'অনলাইন ম্যাচে টানা ৫টি ম্যাচ জয় করুন।',
    icon: '🔥',
    xpReward: 180,
  },
  {
    id: 'three_player_champion',
    title: 'Triple Threat Triumph',
    titleBn: 'ত্রিমুখী যুদ্ধের চ্যাম্পিয়ন',
    description: 'Win a 3-player Free-for-All classroom battle.',
    descriptionBn: '৩ জন খেলোয়াড়ের ত্রিমুখী যুদ্ধে বিজয়ী হন।',
    icon: '👑',
    xpReward: 150,
  },
  {
    id: 'play_with_friends',
    title: 'Study Group Duel',
    titleBn: 'বন্ধুর সাথে লড়াই',
    description: 'Play a match from a private room or username challenge.',
    descriptionBn: 'প্রাইভেট রুম বা চ্যালেঞ্জের মাধ্যমে বন্ধুর সাথে খেলুন।',
    icon: '🤝',
    xpReward: 60,
  },
  {
    id: 'veteran_player',
    title: 'Schoolyard Legend',
    titleBn: 'স্কুল প্রাঙ্গণের কিংবদন্তি',
    description: 'Reach a competitive online rating of 1300+.',
    descriptionBn: 'অনলাইন রেটিং ১৩০০ বা তার বেশিতে উন্নীত করুন।',
    icon: '⭐',
    xpReward: 250,
  },
  {
    id: 'ring_out_master',
    title: 'Edge Knockout Ace',
    titleBn: 'নকআউট বিশেষজ্ঞ',
    description: 'Knock out 10 opponent pens over the desk edge.',
    descriptionBn: 'ডেস্কের বাইরে ফেলে মোট ১০টি কলম নকআউট করুন।',
    icon: '💥',
    xpReward: 100,
  },
];
