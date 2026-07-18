/**
 * AWS shape library. Brand-orange tiles with simple white service glyphs.
 * @module shapes/libraries/aws
 */
import { tile } from './builders';
import type { LibraryIcon } from '@/shapes/registry';

const AWS = '#ff9900';
const W = 'fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

export const AWS_ICONS: LibraryIcon[] = [
  tile({ id: 'aws.ec2', label: 'EC2', category: 'AWS', bg: AWS, glyph: `<rect x="14" y="14" width="20" height="20" rx="2" ${W}/><path d="M18 10 v-3 M24 10 v-3 M30 10 v-3 M18 41 v-3 M24 41 v-3 M30 41 v-3 M10 18 h-3 M10 24 h-3 M10 30 h-3 M41 18 h3 M41 24 h3 M41 30 h3" ${W}/>` }),
  tile({ id: 'aws.s3', label: 'S3', category: 'AWS', bg: AWS, glyph: `<path d="M14 14 h20 l-2 22 a8 4 0 0 1 -16 0 Z" ${W}/><path d="M12 14 a12 4 0 0 0 24 0" ${W}/>` }),
  tile({ id: 'aws.lambda', label: 'Lambda', category: 'AWS', bg: AWS, glyph: `<path d="M12 38 L22 12 h6 L18 38 Z M26 20 L38 38 h-6 L24 26" fill="#fff" stroke="none"/>` }),
  tile({ id: 'aws.rds', label: 'RDS', category: 'AWS', bg: AWS, glyph: `<ellipse cx="24" cy="14" rx="11" ry="4" ${W}/><path d="M13 14 v20 a11 4 0 0 0 22 0 v-20" ${W}/>` }),
  tile({ id: 'aws.vpc', label: 'VPC', category: 'AWS', bg: AWS, glyph: `<rect x="10" y="10" width="28" height="28" rx="3" ${W}/><circle cx="18" cy="24" r="3" ${W}/><circle cx="30" cy="17" r="3" ${W}/><circle cx="30" cy="31" r="3" ${W}/><path d="M21 24 h6 M27 20 l-6 4 M27 28 l-6 -4" ${W}/>` }),
  tile({ id: 'aws.dynamodb', label: 'DynamoDB', category: 'AWS', bg: AWS, glyph: `<ellipse cx="24" cy="14" rx="12" ry="4" ${W}/><path d="M12 14 v20 a12 4 0 0 0 24 0 v-20 M12 24 a12 4 0 0 0 24 0" ${W}/>` }),
  tile({ id: 'aws.cloudfront', label: 'CloudFront', category: 'AWS', bg: AWS, glyph: `<circle cx="24" cy="24" r="14" ${W}/><path d="M10 24 h28 M24 10 c6 6 6 22 0 28 c-6 -6 -6 -22 0 -28" ${W}/>` }),
  tile({ id: 'aws.sns', label: 'SNS', category: 'AWS', bg: AWS, glyph: `<circle cx="24" cy="24" r="5" ${W}/><path d="M24 19 v-8 M24 29 v8 M19 24 h-8 M29 24 h8" ${W}/>` }),
];
