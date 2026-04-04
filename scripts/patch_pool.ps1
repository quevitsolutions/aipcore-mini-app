$content = Get-Content "src\App.jsx" -Raw -Encoding UTF8

$startPattern = "  const renderPool = () => {"
$endPattern = "  const renderEarn = () =>"

$startIdx = $content.IndexOf($startPattern)
$endIdx = $content.IndexOf($endPattern)

if ($startIdx -lt 0 -or $endIdx -lt 0) {
    Write-Error "Pattern not found! Start=$startIdx End=$endIdx"
    exit 1
}

$before = $content.Substring(0, $startIdx)
$after  = $content.Substring($endIdx)

$newPool = @'
  const renderPool = () => {
    if (!rewardPoolData) {
      return (
        <div className="p-4 pb-24 h-full flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
            <Flame className="w-10 h-10 text-white/20" />
          </div>
          <h3 className="text-xl font-black text-white uppercase mb-2">Pool Synchronization</h3>
          <p className="text-xs opacity-40 uppercase tracking-widest max-w-[200px]">Node activation required for pool eligibility.</p>
        </div>
      );
    }

    const { currentPoolId, poolName, claimable, totalEarned, remainingCap, lifetimeCap, isQualifiedForNext, nextPoolId, nfeTier } = rewardPoolData;

    // CORRECT TIER MAPPING:
    // nfeTier = user's actual AIPCore tier from contract (0=none, 1-18=unlocked tiers)
    // Pool tier gates: Bronze >= 6, Silver >= 10, Gold >= 14
    // missingRequirements from contract = deltas, we compute local for accuracy

    const BRONZE_TIER = 6, SILVER_TIER = 10, GOLD_TIER = 14;
    const BRONZE_DIRECT = 2, SILVER_DIRECT = 5, GOLD_DIRECT = 10;
    const BRONZE_TEAM = 62, SILVER_TEAM = 2046, GOLD_TEAM = 32766;

    const userTier    = Number(nfeTier) || nodeTier || 0;
    const userDirects = onchainStats?.directNodes || 0;
    const userTeam    = onchainStats?.totalMatrixNodes || 0;

    const bronzeQualified = userTier >= BRONZE_TIER && userDirects >= BRONZE_DIRECT && userTeam >= BRONZE_TEAM;
    const silverQualified = userTier >= SILVER_TIER && userDirects >= SILVER_DIRECT && userTeam >= SILVER_TEAM;
    const goldQualified   = userTier >= GOLD_TIER   && userDirects >= GOLD_DIRECT   && userTeam >= GOLD_TEAM;

    const getPoolColor = (id) => {
      if (id === 3 || poolName === 'Gold') return '#FFD700';
      if (id === 2 || poolName === 'Silver') return '#C0C0C0';
      return '#CD7F32';
    };
    const poolColor   = currentPoolId > 0 ? getPoolColor(currentPoolId) : '#00ff88';
    const nextPoolColor = getPoolColor(nextPoolId);
    const nextPoolName = nextPoolId === 3 ? 'GOLD' : nextPoolId === 2 ? 'SILVER' : 'BRONZE';

    const capPct = (lifetimeCap && lifetimeCap > 0n)
      ? Math.max(5, Math.round(((Number(lifetimeCap) - Number(remainingCap)) / Number(lifetimeCap)) * 100))
      : 0;

    return (
      <div className="p-4 pb-28 h-full overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-end mb-5">
          <div>
            <h2 className="text-3xl font-black text-[#00ff88]">REWARD POOL</h2>
            <p className="text-[10px] text-white opacity-40 font-black uppercase tracking-widest">Global Dividend Distribution</p>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <div className="px-3 py-1 rounded-lg border" style={{ borderColor: `${poolColor}40`, backgroundColor: `${poolColor}15` }}>
              <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: poolColor }}>
                {currentPoolId > 0 ? poolName.toUpperCase() : 'NOT REGISTERED'}
              </span>
            </div>
            <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">NFE TIER {userTier}</span>
          </div>
        </div>

        {/* Claimable Card */}
        {currentPoolId > 0 && (
          <div className="glass-card p-6 rounded-[40px] mb-5 border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ backgroundColor: poolColor }} />
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">Claimable Rewards</p>
                <div className="flex items-baseline space-x-2">
                  <h4 className="text-4xl font-black text-white">{formatBNB(claimable)}</h4>
                  <span className="text-sm font-black text-[#00ff88]">BNB</span>
                </div>
              </div>
              <button
                onClick={handlePoolClaim}
                disabled={isProcessing || Number(claimable) === 0}
                className="px-6 py-3 text-black font-black rounded-2xl shadow-lg active:scale-95 disabled:opacity-30 disabled:grayscale transition-all text-xs"
                style={{ backgroundColor: Number(claimable) > 0 ? poolColor : '#ffffff20' }}
              >
                CLAIM
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Lifetime Earnings Cap</span>
                <span className="text-[10px] font-black text-white">{formatBNB(remainingCap)} BNB remaining</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${capPct}%`, background: `linear-gradient(to right, ${poolColor}, ${poolColor}88)` }}
                />
              </div>
              <p className="text-[9px] opacity-30 font-black text-right">Cap: {formatBNB(lifetimeCap)} BNB</p>
            </div>
          </div>
        )}

        {/* NFE Tier Card - KEY: Shows actual tier vs pool requirements */}
        <div className="glass-card p-5 rounded-3xl mb-5 border-white/5 bg-white/[0.02]">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Your Node Status</p>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 rounded-2xl bg-[#00ff88]/10 border border-[#00ff88]/30 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-[#00ff88]">{userTier}</span>
                <span className="text-[7px] font-black opacity-40 uppercase">Tier</span>
              </div>
              <div>
                <p className="text-sm font-black text-white">Current NFE Tier</p>
                <p className="text-[10px] opacity-40 font-black">Min: Bronze=6 / Silver=10 / Gold=14</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black opacity-40 uppercase mb-0.5">Directs</p>
              <p className="text-xl font-black text-white">{userDirects}</p>
            </div>
          </div>

          {/* Tier progress bar toward next pool */}
          {!goldQualified && (
            <div>
              {!bronzeQualified && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[9px] font-black uppercase" style={{ color: '#CD7F32' }}>Bronze Tier Progress ({userTier}/{BRONZE_TIER})</span>
                    <span className="text-[9px] font-black opacity-50">{Math.min(100, Math.round((userTier/BRONZE_TIER)*100))}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100,(userTier/BRONZE_TIER)*100)}%`, backgroundColor: '#CD7F32' }} />
                  </div>
                </div>
              )}
              {bronzeQualified && !silverQualified && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[9px] font-black uppercase" style={{ color: '#C0C0C0' }}>Silver Tier Progress ({userTier}/{SILVER_TIER})</span>
                    <span className="text-[9px] font-black opacity-50">{Math.min(100, Math.round((userTier/SILVER_TIER)*100))}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100,(userTier/SILVER_TIER)*100)}%`, backgroundColor: '#C0C0C0' }} />
                  </div>
                </div>
              )}
              {silverQualified && !goldQualified && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[9px] font-black uppercase" style={{ color: '#FFD700' }}>Gold Tier Progress ({userTier}/{GOLD_TIER})</span>
                    <span className="text-[9px] font-black opacity-50">{Math.min(100, Math.round((userTier/GOLD_TIER)*100))}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100,(userTier/GOLD_TIER)*100)}%`, backgroundColor: '#FFD700' }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pool Eligibility Grid */}
        <div className="mb-5">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Pool Eligibility Map</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'BRONZE', color: '#CD7F32', reqTier: BRONZE_TIER, reqDirect: BRONZE_DIRECT, reqTeam: BRONZE_TEAM, qualified: bronzeQualified },
              { name: 'SILVER', color: '#C0C0C0', reqTier: SILVER_TIER, reqDirect: SILVER_DIRECT, reqTeam: SILVER_TEAM, qualified: silverQualified },
              { name: 'GOLD',   color: '#FFD700', reqTier: GOLD_TIER,   reqDirect: GOLD_DIRECT,   reqTeam: GOLD_TEAM,   qualified: goldQualified   },
            ].map(pool => (
              <div key={pool.name}
                className="glass-card p-3 rounded-2xl border transition-all relative overflow-hidden"
                style={{ borderColor: pool.qualified ? `${pool.color}40` : 'rgba(255,255,255,0.05)', background: pool.qualified ? `${pool.color}08` : undefined, opacity: pool.qualified ? 1 : 0.6 }}>
                {pool.qualified && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: pool.color }} />}
                <p className="text-[7px] font-black uppercase mb-2 tracking-widest" style={{ color: pool.color }}>{pool.name}</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[7px] opacity-40">Tier</span>
                    <span className={`text-[8px] font-black ${userTier >= pool.reqTier ? 'text-[#00ff88]' : 'text-red-400'}`}>{userTier}/{pool.reqTier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[7px] opacity-40">Dir</span>
                    <span className={`text-[8px] font-black ${userDirects >= pool.reqDirect ? 'text-[#00ff88]' : 'text-red-400'}`}>{userDirects}/{pool.reqDirect}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[7px] opacity-40">Team</span>
                    <span className={`text-[8px] font-black ${userTeam >= pool.reqTeam ? 'text-[#00ff88]' : 'text-yellow-400'}`}>{userTeam >= 1000 ? `${(userTeam/1000).toFixed(1)}k` : userTeam}/{pool.reqTeam >= 1000 ? `${(pool.reqTeam/1000).toFixed(0)}k` : pool.reqTeam}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pool Action */}
        <div className="mb-5">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Pool Action</p>
          {currentPoolId === 0 ? (
            <div className="glass-card p-6 rounded-3xl border-dashed border-2 border-[#00ff88]/30 bg-transparent text-center">
              <ShieldAlert className="w-8 h-8 text-[#00ff88]/50 mx-auto mb-3" />
              <p className="text-sm font-black text-white mb-4">NOT REGISTERED IN ANY POOL</p>
              {bronzeQualified ? (
                <button
                  onClick={handlePoolRegister}
                  disabled={isProcessing}
                  className="w-full py-4 bg-[#00ff88] text-black font-black rounded-2xl active:scale-95 transition-transform"
                >
                  {isProcessing ? 'REGISTERING...' : 'ENTER BRONZE POOL'}
                </button>
              ) : (
                <div className="space-y-2 text-left bg-black/40 p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-2">Requirements — Bronze Pool:</p>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold opacity-60 uppercase">Node Tier</span>
                    <span className={`text-[10px] font-black ${userTier >= BRONZE_TIER ? 'text-[#00ff88]' : 'text-red-400'}`}>
                      {userTier >= BRONZE_TIER ? '✓ Met' : `Tier ${userTier} → need Tier ${BRONZE_TIER}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold opacity-60 uppercase">Direct Refs</span>
                    <span className={`text-[10px] font-black ${userDirects >= BRONZE_DIRECT ? 'text-[#00ff88]' : 'text-red-400'}`}>
                      {userDirects >= BRONZE_DIRECT ? '✓ Met' : `${userDirects} → need ${BRONZE_DIRECT}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold opacity-60 uppercase">Team Size</span>
                    <span className={`text-[10px] font-black ${userTeam >= BRONZE_TEAM ? 'text-[#00ff88]' : 'text-yellow-400'}`}>
                      {userTeam >= BRONZE_TEAM ? '✓ Met' : `${userTeam} → need ${BRONZE_TEAM}`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-6 rounded-3xl border-white/5 bg-white/[0.02]">
              {nextPoolId > 0 ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: nextPoolColor }}>UPGRADE TO: {nextPoolName} POOL</span>
                    {isQualifiedForNext && <span className="text-[8px] font-black bg-[#00ff88]/20 text-[#00ff88] px-2 py-1 rounded">QUALIFIED</span>}
                  </div>
                  {isQualifiedForNext ? (
                    <button
                      onClick={handlePoolRegister}
                      disabled={isProcessing}
                      className="w-full py-4 text-black font-black rounded-2xl shadow-lg active:scale-95 text-sm"
                      style={{ background: `linear-gradient(to right, ${nextPoolColor}, ${nextPoolColor}88)` }}
                    >
                      {isProcessing ? 'SYNCING...' : `UPGRADE TO ${nextPoolName}`}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {(() => {
                        const reqTier   = nextPoolId === 3 ? GOLD_TIER   : nextPoolId === 2 ? SILVER_TIER   : BRONZE_TIER;
                        const reqDirect = nextPoolId === 3 ? GOLD_DIRECT : nextPoolId === 2 ? SILVER_DIRECT : BRONZE_DIRECT;
                        const reqTeam   = nextPoolId === 3 ? GOLD_TEAM   : nextPoolId === 2 ? SILVER_TEAM   : BRONZE_TEAM;
                        return (
                          <>
                            <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest mb-2">Requirements — {nextPoolName} Pool:</p>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold opacity-60 uppercase">Node Tier</span>
                              <span className={`text-[10px] font-black ${userTier >= reqTier ? 'text-[#00ff88]' : 'text-red-400'}`}>
                                {userTier >= reqTier ? '✓ Met' : `Tier ${userTier} → need Tier ${reqTier} (${reqTier - userTier} more)`}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold opacity-60 uppercase">Direct Refs</span>
                              <span className={`text-[10px] font-black ${userDirects >= reqDirect ? 'text-[#00ff88]' : 'text-red-400'}`}>
                                {userDirects >= reqDirect ? '✓ Met' : `${userDirects} → need ${reqDirect}`}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold opacity-60 uppercase">Team Size</span>
                              <span className={`text-[10px] font-black ${userTeam >= reqTeam ? 'text-[#00ff88]' : 'text-yellow-400'}`}>
                                {userTeam >= reqTeam ? '✓ Met' : `${userTeam} → need ${reqTeam}`}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-2xl mb-2">🏆</p>
                  <p className="text-sm font-black text-[#FFD700]">GOLD POOL ACHIEVED</p>
                  <p className="text-[10px] opacity-40 uppercase font-black mt-1">Maximum pool level reached</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Network Stats */}
        {globalPoolStats && (
          <div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Network Distribution</p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { label: 'Bronze', count: globalPoolStats.bronzeNodes, color: '#CD7F32' },
                { label: 'Silver', count: globalPoolStats.silverNodes, color: '#C0C0C0' },
                { label: 'Gold',   count: globalPoolStats.goldNodes,   color: '#FFD700' },
              ].map(pool => (
                <div key={pool.label} className="glass-card p-4 rounded-2xl border-white/5 bg-black/20 text-center">
                  <p className="text-[8px] font-black uppercase mb-1" style={{ color: pool.color }}>{pool.label}</p>
                  <p className="text-lg font-black text-white">{pool.count}</p>
                  <p className="text-[7px] opacity-30 font-black uppercase">nodes</p>
                </div>
              ))}
            </div>
            <div className="glass-card p-4 rounded-2xl border-white/5 bg-black/10">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">Total Pool Received</span>
                <span className="text-[10px] font-black text-[#00ff88]">{formatBNB(globalPoolStats.totalReceived)} BNB</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">Total Distributed</span>
                <span className="text-[10px] font-black text-white">{formatBNB(globalPoolStats.totalDistributed)} BNB</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

'@

$newContent = $before + $newPool + $after
[System.IO.File]::WriteAllText((Resolve-Path "src\App.jsx").Path, $newContent, [System.Text.Encoding]::UTF8)
Write-Host "SUCCESS: renderPool replaced. New size: $($newContent.Length) bytes"
