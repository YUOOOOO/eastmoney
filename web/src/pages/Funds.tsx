import { useState, useEffect } from 'react';
import { 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  IconButton, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Autocomplete,
  CircularProgress,
  Chip,
  Box,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  Tooltip as MuiTooltip,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HistoryIcon from '@mui/icons-material/History';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PieChartIcon from '@mui/icons-material/PieChart';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EditIcon from '@mui/icons-material/Edit';

import { 
  fetchFunds, 
  saveFund, 
  deleteFund, 
  searchMarketFunds, 
  fetchFundMarketDetails, 
  fetchFundNavHistory,
  generateReport,
} from '../api';

import type{MarketFund,FundItem,NavPoint}  from '../api';


export default function FundsPage() {
  const [funds, setFunds] = useState<FundItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Table State
  const [searchQuery, setSearchQuery] = useState('');

  // Unified Dialog State (Add/Edit)
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFund, setEditingFund] = useState<FundItem | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formStyle, setFormStyle] = useState('');
  const [formFocus, setFormFocus] = useState('');
  const [formPreTime, setFormPreTime] = useState('');
  const [formPostTime, setFormPostTime] = useState('');

  // Search State
  const [searchResults, setSearchResults] = useState<MarketFund[]>([]);
  const [searching, setSearching] = useState(false);

  // Detail View State
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState<FundItem | null>(null);
  const [fundDetails, setFundDetails] = useState<any>(null);
  const [navHistory, setNavHistory] = useState<NavPoint[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailTab, setDetailTab] = useState(0);

  // Action Menu State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuFund, setMenuFund] = useState<FundItem | null>(null);

  // Notification State
  const [notify, setNotify] = useState<{ open: boolean, message: string, severity: 'success' | 'info' | 'warning' | 'error' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const showNotify = (message: string, severity: 'success' | 'info' | 'warning' | 'error' = 'info') => { 
    setNotify({ open: true, message, severity });
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, fund: FundItem) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuFund(fund);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuFund(null);
  };

  const handleRunAnalysis = async (mode: 'pre' | 'post') => {
    if (!menuFund) return;
    try {
        showNotify(`Initializing ${mode.toUpperCase()} market intelligence for ${menuFund.code}...`, 'info');
        await generateReport(mode, menuFund.code);
        showNotify(`Intelligence node ${menuFund.code} triggered successfully. Check reports shortly.`, 'success');
    } catch (error) {
        showNotify(`Failed to trigger intelligence node: ${error}`, 'error');
    }
  };

  const handleOpenDialog = (fund?: FundItem) => {
    setAnchorEl(null);
    setSearchResults([]);
    if (fund) {
        setEditingFund(fund);
        setFormCode(fund.code);
        setFormName(fund.name);
        setFormStyle(fund.style || '');
        setFormFocus(fund.focus?.join(', ') || '');
        setFormPreTime(fund.pre_market_time || '');
        setFormPostTime(fund.post_market_time || '');
    } else {
        setEditingFund(null);
        setFormCode('');
        setFormName('');
        setFormStyle('');
        setFormFocus('');
        setFormPreTime('09:15');
        setFormPostTime('15:30');
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formCode || !formName) {
        showNotify('Code and Name are required', 'error');
        return;
    }

    const focusArray = formFocus.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    const updatedFund: FundItem = {
        code: formCode,
        name: formName,
        style: formStyle,
        focus: focusArray,
        pre_market_time: formPreTime || undefined,
        post_market_time: formPostTime || undefined,
        is_active: true
    };

    try {
        await saveFund(updatedFund);
        showNotify(`Fund ${formCode} saved successfully`, 'success');
        setOpenDialog(false);
        loadFunds();
    } catch (error) {
        showNotify(`Failed to save fund: ${error}`, 'error');
    }
  };

  const handleSearch = async (query: string) => {
    if (query.length < 2) return;
    setSearching(true);
    try {
      const results = await searchMarketFunds(query);
      setSearchResults(results);
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const handleMarketFundSelect = (_event: any, value: MarketFund | null) => {
    if (value) {
        setFormCode(value.code);
        setFormName(value.name);
        setFormStyle(value.type || '');
    }
  };

  useEffect(() => {
    loadFunds();
  }, []);

  const loadFunds = async () => {
    setLoading(true);
    try {
      const data = await fetchFunds();
      setFunds(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (window.confirm('Are you sure you want to remove this fund from your watch list?')) {
      try {
        await deleteFund(code);
        showNotify('Fund removed from watchlist', 'success');
        loadFunds();
      } catch (error) {
        showNotify(`Error removing fund: ${error}`, 'error');
      }
    }
  };
  const handleViewDetails = async (fund: FundItem) => {
    setSelectedFund(fund);
    setDetailOpen(true);
    setLoadingDetails(true);
    setFundDetails(null);
    setNavHistory([]);
    
    try {
      const [details, nav] = await Promise.all([
        fetchFundMarketDetails(fund.code),
        fetchFundNavHistory(fund.code)
      ]);
      setFundDetails(details);
      setNavHistory(nav);
    } catch (error) {
      console.error("Failed to load fund details", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Improved SVG Line Chart Renderer
  const renderMiniChart = (data: NavPoint[]) => {
    if (!data || data.length < 2) return null;
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const padding = 20;
    const width = 800;
    const height = 240;
    
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
      const y = (height - padding) - ((d.value - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    return (
      <Box sx={{ bgcolor: '#fcfcfc', p: 2, borderRadius: '12px', border: '1px solid #f1f5f9' }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
          {/* Horizontal Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((v) => {
              const y = (height - padding) - v * (height - 2 * padding);
              const val = (min + v * range).toFixed(4);
              return (
                  <g key={v}>
                      <line x1={padding} y1={y} x2={width-padding} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
                      <text x={0} y={y + 4} fontSize="10" fill="#94a3b8" fontFamily="JetBrains Mono">{val}</text>
                  </g>
              )
          })}
          <polyline
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          {/* Shadow area */}
          <path
            d={`M${padding},${height-padding} L${points} L${width-padding},${height-padding} Z`}
            fill="rgba(99, 102, 241, 0.08)"
          />
        </svg>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Typography variant="h4" className="font-bold text-slate-900" sx={{ fontFamily: 'JetBrains Mono' }}>
            UNIVERSE
          </Typography>
          <Typography variant="subtitle1" className="text-slate-500 mt-1">
            Active Portfolio Configuration & Intelligence
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            backgroundColor: '#6366f1',
            borderRadius: '10px',
            px: 3,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { backgroundColor: '#4f46e5' }
          }}
        >
          Add Target
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <CircularProgress size={32} sx={{ color: '#6366f1' }} />
        </div>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem', py: 2 }}>FUND ENTITY</TableCell>
                <TableCell sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem', py: 2 }}>STRATEGY</TableCell>
                <TableCell sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem', py: 2 }}>SECTORS</TableCell>
                <TableCell sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem', py: 2 }}>AUTO SCHEDULE</TableCell>
                <TableCell align="right" sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.75rem', py: 2 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {funds.map((fund) => (
                <TableRow 
                  key={fund.code} 
                  hover 
                  onClick={() => handleViewDetails(fund)}
                  sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, bgcolor: '#f1f5f9', borderRadius: '10px', color: '#6366f1' }}>    
                        <AccountBalanceWalletIcon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>{fund.name}</Typography>
                        <Typography sx={{ color: '#94a3b8', fontFamily: 'JetBrains Mono', fontSize: '0.75rem' }}>{fund.code}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={fund.style || 'Other'} 
                      size="small" 
                      variant="outlined" 
                      sx={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 800, 
                        color: '#64748b', 
                        bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px'
                      }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {fund.focus?.map((tag, i) => (
                            <Chip key={i} label={tag} size="small" sx={{ fontSize: '0.6rem', height: '18px', bgcolor: '#f1f5f9', color: '#64748b' }} />
                        ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {(!fund.pre_market_time && !fund.post_market_time) ? (
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>MANUAL ONLY</Typography>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {fund.pre_market_time && <Chip label={`PRE ${fund.pre_market_time}`} size="small" sx={{ fontSize: '0.6rem', height: '18px', bgcolor: 'rgba(99, 102, 241, 0.05)', color: '#6366f1', fontWeight: 800 }} />}
                            {fund.post_market_time && <Chip label={`POST ${fund.post_market_time}`} size="small" sx={{ fontSize: '0.6rem', height: '18px', bgcolor: 'rgba(245, 158, 11, 0.05)', color: '#d97706', fontWeight: 800 }} />}
                        </Box>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleOpenMenu(e, fund)}
                      sx={{ color: '#94a3b8', '&:hover': { color: '#6366f1', bgcolor: 'rgba(99, 102, 241, 0.05)' } }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Notifications */}
      <Snackbar 
        open={notify.open} 
        autoHideDuration={4000} 
        onClose={() => setNotify(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={notify.severity} sx={{ width: '100%', borderRadius: '10px', fontWeight: 700, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          {notify.message}
        </Alert>
      </Snackbar>

      {/* Fund Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
            elevation: 2,
            sx: { 
                minWidth: 200, 
                bgcolor: '#ffffff', 
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                mt: 1,
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
            }
        }}
      >
        <MenuItem onClick={() => { handleCloseMenu(); if (menuFund) handleViewDetails(menuFund); }} sx={{ py: 1.5 }}>
            <ListItemIcon><AnalyticsIcon fontSize="small" sx={{ color: '#6366f1' }} /></ListItemIcon>    
            <ListItemText primary="View Intelligence" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 700 }} />
        </MenuItem>
        
        <Divider sx={{ my: 0.5, borderColor: '#f1f5f9' }} />

        <MenuItem onClick={() => { handleCloseMenu(); handleRunAnalysis('pre'); }} sx={{ py: 1 }}>       
            <ListItemIcon><AssessmentIcon fontSize="small" color="primary" /></ListItemIcon>
            <ListItemText primary="Run Pre-Market Now" primaryTypographyProps={{ fontSize: '0.85rem', color: '#334155' }} />
        </MenuItem>
        <MenuItem onClick={() => { handleCloseMenu(); handleRunAnalysis('post'); }} sx={{ py: 1 }}>      
            <ListItemIcon><AssessmentIcon fontSize="small" sx={{ color: '#f59e0b' }} /></ListItemIcon>   
            <ListItemText primary="Run Post-Market Now" primaryTypographyProps={{ fontSize: '0.85rem', color: '#334155' }} />
        </MenuItem>
        
        <Divider sx={{ my: 0.5, borderColor: '#f1f5f9' }} />

        <MenuItem onClick={() => { handleCloseMenu(); if (menuFund) handleOpenDialog(menuFund); }} sx={{ py: 1 }}>
            <ListItemIcon><EditIcon fontSize="small" sx={{ color: '#64748b' }} /></ListItemIcon>
            <ListItemText primary="Edit Config" primaryTypographyProps={{ fontSize: '0.85rem', color: '#334155' }} />
        </MenuItem>
        <MenuItem onClick={() => { handleCloseMenu(); if (menuFund) handleDelete(menuFund.code); }} sx={{ py: 1 }}>
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText primary="Delete" primaryTypographyProps={{ fontSize: '0.85rem', color: '#f43f5e', fontWeight: 700 }} />
        </MenuItem>
      </Menu>

      {/* Add/Edit Fund Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid #f1f5f9' }}>
            {editingFund ? 'Edit Configuration' : 'Add New Target'}
        </DialogTitle>
        <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 3 }}>
                
                {/* 1. Market Search (Only for new targets) */}
                {!editingFund && (
                    <Box>
                        <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 800, mb: 1, display: 'block' }}>Market Intelligence Search</Typography>
                        <Autocomplete
                            fullWidth
                            onInputChange={(_, value) => handleSearch(value)}
                            onChange={handleMarketFundSelect}
                            options={searchResults}
                            getOptionLabel={(option) => `[${option.code}] ${option.name}`}
                            loading={searching}
                            renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Search Fund Code or Name"
                                variant="outlined"
                                size="small"
                                InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                    <>
                                    <SearchIcon className="text-slate-400 mr-2" />
                                    {params.InputProps.startAdornment}
                                    </>
                                ),
                                endAdornment: (
                                    <>
                                    {searching ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                    </>
                                ),
                                }}
                            />
                            )}
                        />
                    </Box>
                )}

                {/* 2. Asset Identity */}
                <Box>
                    <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 800, mb: 1, display: 'block' }}>Asset Identity</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={4}>
                            <TextField
                                label="Fund Code"
                                fullWidth
                                size="small"
                                value={formCode}
                                onChange={(e) => setFormCode(e.target.value)}
                                disabled={!!editingFund}
                                placeholder="000000"
                            />
                        </Grid>
                        <Grid item xs={8}>
                            <TextField
                                label="Fund Name"
                                fullWidth
                                size="small"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="Target Name"
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* 3. Strategy Configuration */}
                <Box>
                    <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 800, mb: 1, display: 'block' }}>Strategy Configuration</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                label="Style"
                                fullWidth
                                size="small"
                                value={formStyle}
                                onChange={(e) => setFormStyle(e.target.value)}
                                placeholder="Growth, Sector, etc."
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Focus Sectors"
                                fullWidth
                                size="small"
                                value={formFocus}
                                onChange={(e) => setFormFocus(e.target.value)}
                                placeholder="AI, Bio, Chips..."
                                helperText="Comma separated"
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* 4. Automation Windows */}
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                    <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryIcon sx={{ fontSize: 16 }} /> Intelligence Schedule (24H)
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                label="Pre-Market"
                                type="time"
                                fullWidth
                                size="small"
                                value={formPreTime}
                                onChange={(e) => setFormPreTime(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Post-Market"
                                type="time"
                                fullWidth
                                size="small"
                                value={formPostTime}
                                onChange={(e) => setFormPostTime(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: '#64748b', fontWeight: 700 }}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            sx={{ bgcolor: '#6366f1', fontWeight: 800, borderRadius: '8px', px: 4, '&:hover': { bgcolor: '#4f46e5' } }}
          >
            Confirm Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fund Details Dialog - Professional Financial Factsheet */}

      {/* Fund Details Dialog - Professional Financial Factsheet */}
      <Dialog 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        maxWidth="sm" 
        fullWidth
        scroll="paper"
        PaperProps={{ 
          sx: { 
            borderRadius: '20px', 
            bgcolor: '#ffffff', 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            height: '90vh',
          } 
        }}
      >
        {/* Header Section - Modern Ticker Style */}
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ 
            bgcolor: '#fcfcfc', 
            p: 3.5, 
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', mb: 1, lineHeight: 1.2 }}>
                    {selectedFund?.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Box sx={{ px: 1, py: 0.25, bgcolor: '#6366f1', borderRadius: '4px' }}>
                        <Typography sx={{ color: '#fff', fontWeight: 800, fontFamily: 'JetBrains Mono', fontSize: '0.75rem' }}>
                            {selectedFund?.code}
                        </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {typeof fundDetails?.info?.type === 'string' ? fundDetails.info.type : 'Sector Strategy'}
                    </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right', minWidth: '120px' }}>
                <Typography sx={{ color: '#6366f1', fontSize: '0.7rem', fontWeight: 900, mb: 0.5, letterSpacing: '0.1em' }}>LATEST NAV</Typography>
                <Typography variant="h4" sx={{ color: '#0f172a', fontWeight: 900, fontFamily: 'JetBrains Mono', lineHeight: 1 }}>
                    {fundDetails?.info?.nav && typeof fundDetails.info.nav !== 'object' && fundDetails.info.nav !== "---" 
                      ? fundDetails.info.nav 
                      : (navHistory.length > 0 ? navHistory[navHistory.length - 1].value.toFixed(4) : '---')}
                </Typography>
              </Box>
            </Box>
            
            {/* Quick Metadata Grid */}
            <Grid container spacing={2} sx={{ mt: 1 }}>
                 {[
                   { label: 'MANAGER', value: fundDetails?.info?.manager },
                   { label: 'FUND SIZE', value: fundDetails?.info?.size },
                   { label: 'MORNINGSTAR', value: fundDetails?.info?.rating },
                 ].map((item, i) => (
                   <Grid item xs={4} key={i}>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 800, mb: 0.5 }}>{item.label}</Typography>
                      <Typography sx={{ color: '#334155', fontSize: '0.75rem', fontWeight: 700 }}>
                        {item.value && typeof item.value !== 'object' ? item.value : '---'}
                      </Typography>
                   </Grid>
                 ))}
            </Grid>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, bgcolor: '#ffffff' }}>
          {loadingDetails ? (
            <Box sx={{ py: 12, textAlign: 'center' }}>
              <CircularProgress size={32} thickness={5} sx={{ color: '#6366f1', mb: 2 }} />
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>Fetching Market Intelligence...</Typography>
            </Box>
          ) : fundDetails ? (
            <Box sx={{ p: 3.5, display: 'flex', flexDirection: 'column', gap: 5 }}>
              
              {/* 1. Core Chart Section */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="overline" sx={{ color: '#0f172a', fontWeight: 900, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUpIcon sx={{ fontSize: 18, color: '#6366f1' }} /> Performance Analytics
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>Last 100 Trading Days</Typography>
                </Box>
                <Box sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #f1f5f9', bgcolor: '#fcfcfc', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                    {renderMiniChart(navHistory)}
                </Box>
              </Box>

              {/* 2. Statistical Data Tabs */}
              <Box>
                <Typography variant="overline" sx={{ color: '#0f172a', fontWeight: 900, fontSize: '0.75rem', mb: 2, display: 'block' }}>
                    Historical Reference
                </Typography>
                <Tabs 
                    value={detailTab} 
                    onChange={(_, v) => setDetailTab(v)}
                    sx={{
                        minHeight: '40px',
                        mb: 2.5,
                        borderBottom: '1px solid #f1f5f9',
                        '& .MuiTab-root': { py: 1, minHeight: '40px', textTransform: 'none', fontWeight: 800, fontSize: '0.85rem', color: '#94a3b8' },
                        '& .Mui-selected': { color: '#6366f1 !important' },
                        '& .MuiTabs-indicator': { bgcolor: '#6366f1', height: 3, borderRadius: '3px 3px 0 0' }
                    }}
                >
                    <Tab label="Performance Stats" />
                    <Tab label="NAV Timeline" />
                </Tabs>

                {detailTab === 0 ? (
                    <TableContainer sx={{ borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.7rem' }}>TIMEFRAME</TableCell>
                                    <TableCell align="right" sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.7rem' }}>RETURN</TableCell>
                                    <TableCell align="right" sx={{ color: '#64748b', fontWeight: 800, fontSize: '0.7rem' }}>RANK</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {fundDetails.performance.map((p: any, idx: number) => (
                                    <TableRow key={idx} hover sx={{ '&:last-child td': { border: 0 } }}>
                                        <TableCell sx={{ color: '#334155', fontWeight: 700, fontSize: '0.8rem' }}>{p['时间范围']}</TableCell>
                                        <TableCell align="right" sx={{ 
                                            fontWeight: 900, 
                                            fontFamily: 'JetBrains Mono',
                                            fontSize: '0.85rem',
                                            color: (p['收益率'] === null || p['收益率'] === undefined) ? '#cbd5e1' : (parseFloat(p['收益率']) >= 0 ? '#ef4444' : '#22c55e')
                                        }}>
                                            {p['收益率'] !== null && p['收益率'] !== undefined ? `${p['收益率']}%` : '---'}
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800 }}>{p['同类排名']}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <TableContainer sx={{ borderRadius: '12px', border: '1px solid #f1f5f9', maxHeight: '320px' }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ bgcolor: '#f8fafc', color: '#64748b', fontWeight: 800, fontSize: '0.7rem' }}>DATE</TableCell>
                                    <TableCell align="right" sx={{ bgcolor: '#f8fafc', color: '#64748b', fontWeight: 800, fontSize: '0.7rem' }}>ADJ. NAV</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {[...navHistory].reverse().map((point, idx) => (
                                    <TableRow key={idx} hover sx={{ '&:last-child td': { border: 0 } }}>
                                        <TableCell sx={{ color: '#64748b', fontFamily: 'JetBrains Mono', fontSize: '0.75rem' }}>{point.date}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, color: '#0f172a', fontFamily: 'JetBrains Mono', fontSize: '0.85rem' }}>
                                            {point.value !== null && point.value !== undefined ? point.value.toFixed(4) : '---'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
              </Box>

              {/* 3. Strategic Holdings Section */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="overline" sx={{ color: '#0f172a', fontWeight: 900, fontSize: '0.75rem', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PieChartIcon sx={{ fontSize: 18, color: '#6366f1' }} /> Core Strategic Holdings
                </Typography>
                {fundDetails.portfolio && fundDetails.portfolio.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {fundDetails.portfolio.map((stock: any, idx: number) => (
                            <Box key={idx} sx={{ 
                                p: 1.5, 
                                borderRadius: '12px', 
                                border: '1px solid #f1f5f9',
                                '&:hover': { bgcolor: '#f8fafc' },
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ color: '#0f172a', fontWeight: 800, fontSize: '0.85rem' }}>{stock['股票名称']}</Typography>
                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', fontFamily: 'JetBrains Mono' }}>{stock['股票代码']}</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right', width: '40%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5 }}>
                                        <Typography sx={{ color: '#6366f1', fontWeight: 900, fontFamily: 'JetBrains Mono', fontSize: '0.85rem' }}>
                                            {stock['占净值比例']}%
                                        </Typography>
                                        <Box sx={{ width: '60px', height: '6px', bgcolor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                            <Box sx={{ width: `${stock['占净值比例']}%`, height: '100%', bgcolor: '#6366f1', borderRadius: '3px' }} />
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                ) : (
                    <Box sx={{ py: 6, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: '16px', border: '1px dashed #e2e8f0' }}>
                        <PieChartIcon sx={{ fontSize: 32, color: '#e2e8f0', mb: 1 }} />
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700 }}>Portfolio data restricted or unavailable</Typography>
                    </Box>
                )}
              </Box>

            </Box>
          ) : (
             <Box sx={{ py: 15, textAlign: 'center' }}>
                 <Typography sx={{ color: '#94a3b8', fontWeight: 800 }}>VIBE_ALPHA: NODE_NOT_FOUND</Typography>
             </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#fcfcfc', borderTop: '1px solid #f1f5f9' }}>
          <Button 
            fullWidth
            onClick={() => setDetailOpen(false)} 
            variant="contained" 
            sx={{ 
                bgcolor: '#0f172a', 
                color: '#ffffff',
                py: 1.5,
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '0.9rem',
                boxShadow: 'none',
                '&:hover': { bgcolor: '#1e293b', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }
            }}
          >
            Acknowledge & Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
