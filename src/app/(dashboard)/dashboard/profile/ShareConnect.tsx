'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FacebookShareButton, LinkedinShareButton, TwitterShareButton, WhatsappShareButton,
  FacebookIcon, TwitterIcon, LinkedinIcon, WhatsappIcon,
} from 'react-share';
import { QRCodeCanvas } from 'qrcode.react';
import { FaShareAlt } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { itemVariants } from './common';

interface ShareConnectProps {
  userProfile: any;
}

export const ShareConnect: React.FC<ShareConnectProps> = ({ userProfile }) => {
  const [pageUrl, setPageUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && userProfile.uid) {
      setPageUrl(`${window.location.origin}/profile/${userProfile.uid}`);
    }
  }, [userProfile.uid]);

  const shareTitle = `Check out ${userProfile.fullName}'s Profile on Salone Skills Connect`;

  if (!pageUrl) return null;

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible">
      <Card className="bg-transparent border border-slate-800 text-white shadow-xl p-6 max-w-lg mx-auto">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-xl font-semibold text-slate-300 flex items-center gap-2"><FaShareAlt /> Share & Connect</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex flex-col items-center gap-5">
          <div className="bg-white p-3 rounded-lg border-4 border-slate-700">
            <QRCodeCanvas value={pageUrl} size={128} bgColor="#ffffff" fgColor="#0f172a" level="Q" />
          </div>
          <p className="text-sm text-slate-400 text-center">Share this QR code or use the links below to send your public profile.</p>
          <Input type="text" readOnly value={pageUrl} className="w-full bg-slate-800 border-slate-700 text-slate-300" onFocus={(e) => e.target.select()} />
          <div className="flex justify-center items-center gap-3 w-full pt-4 border-t border-slate-800">
            <TwitterShareButton url={pageUrl} title={shareTitle}><TwitterIcon size={40} round /></TwitterShareButton>
            <LinkedinShareButton url={pageUrl} title={shareTitle}><LinkedinIcon size={40} round /></LinkedinShareButton>
            <WhatsappShareButton url={pageUrl} title={shareTitle} separator=":: "><WhatsappIcon size={40} round /></WhatsappShareButton>
            <FacebookShareButton url={pageUrl}><FacebookIcon size={40} round /></FacebookShareButton>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
