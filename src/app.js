// 数据管理
class DataManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.rewards = JSON.parse(localStorage.getItem('rewards')) || [];
        this.points = parseInt(localStorage.getItem('points')) || 0;
        this.stats = JSON.parse(localStorage.getItem('stats')) || {
            completedTasks: 0,
            unlockedRewards: 0
        };
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    saveRewards() {
        localStorage.setItem('rewards', JSON.stringify(this.rewards));
    }

    savePoints() {
        localStorage.setItem('points', this.points.toString());
    }

    saveStats() {
        localStorage.setItem('stats', JSON.stringify(this.stats));
    }

    reset() {
        this.tasks = [];
        this.rewards = [];
        this.points = 0;
        this.stats = {
            completedTasks: 0,
            unlockedRewards: 0
        };
        
        localStorage.removeItem('tasks');
        localStorage.removeItem('rewards');
        localStorage.removeItem('points');
        localStorage.removeItem('stats');
    }
}

// 应用主类
class App {
    constructor() {
        this.data = new DataManager();
        this.initializeUI();
        this.bindEvents();
        this.updateUI();
        document.getElementById('rollDice').disabled = true;
        
        // 预加载音效
        this.sounds = {
            dice: new Audio('./sounds/dice-roll.mp3'),
            success: new Audio('./sounds/success.mp3'),
            unlock: new Audio('./sounds/unlock.mp3'),
            complete: new Audio('./sounds/complete.mp3')
        };
        
        // 添加连抽按钮事件监听
        document.getElementById('rollDice5').addEventListener('click', () => this.multipleRoll(5));
        document.getElementById('rollDice10').addEventListener('click', () => this.multipleRoll(10));
    }

    initializeUI() {
        // 导航切换
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(e.target.getAttribute('href').substring(1));
            });
        });

        // 初始化模态框
        this.taskModal = new bootstrap.Modal(document.getElementById('addTaskModal'));
        this.rewardModal = new bootstrap.Modal(document.getElementById('addRewardModal'));
    }

    bindEvents() {
        // 保存任务
        document.getElementById('saveTask').addEventListener('click', () => this.saveTask());
        
        // 保存奖励
        document.getElementById('saveReward').addEventListener('click', () => this.saveReward());
        
        // 掷骰子
        document.getElementById('rollDice').addEventListener('click', () => this.rollDice());
        
        // 添加重置按钮事件监听
        document.getElementById('resetApp').addEventListener('click', () => {
            if (confirm('确定要重置所有数据吗？这将清除所有任务、奖励和进度。')) {
                this.resetApp();
            }
        });
    }

    switchSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('d-none');
        });
        document.getElementById(sectionId).classList.remove('d-none');
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + sectionId) {
                link.classList.add('active');
            }
        });
    }

    saveTask() {
        const form = document.getElementById('taskForm');
        const task = {
            id: Date.now(),
            name: form.taskName.value,
            description: form.taskDescription.value,
            completed: false,
            diceRolled: false,
            timestamp: new Date().toISOString()
        };

        this.data.tasks.push(task);
        this.data.saveTasks();
        this.updateUI();
        this.taskModal.hide();
        form.reset();
    }

    saveReward() {
        const form = document.getElementById('rewardForm');
        const reward = {
            id: Date.now(),
            name: form.rewardName.value,
            pointsNeeded: parseInt(form.pointsNeeded.value),
            unlocked: false
        };

        this.data.rewards.push(reward);
        this.data.saveRewards();
        this.updateUI();
        this.rewardModal.hide();
        form.reset();
    }

    async rollDice() {
        const hasUnusedCompletedTask = this.data.tasks.some(task => 
            task.completed && !task.diceRolled
        );
        
        if (!hasUnusedCompletedTask) {
            this.showToast('请先完成任务才能掷骰子！', 'warning');
            return;
        }

        // 禁用所有骰子按钮
        const buttons = ['rollDice', 'rollDice5', 'rollDice10'];
        buttons.forEach(id => document.getElementById(id).disabled = true);

        try {
            const result = Math.floor(Math.random() * 6) + 1;
            await this.showRollAnimation(result);

            // 先更新点数
            this.data.points += result;
            this.data.savePoints();
            
            // 标记一个任务为已使用
            const unusedTask = this.data.tasks.find(task => 
                task.completed && !task.diceRolled
            );
            if (unusedTask) {
                unusedTask.diceRolled = true;
                this.data.saveTasks();
            }

            // 检查奖励
            this.checkRewards();
            
            // 更新UI显示
            this.updateUI();

            // 显示结果提示
            if (result === 6) {
                this.showSpecialEffect();
                this.showToast('🎉 恭喜！掷出最大点数！', 'success');
                this.playSound('success');
            } else {
                this.showToast(`掷出了 ${result} 点！`, 'success');
            }

            // 添加点数更新动画
            const pointsDisplay = document.getElementById('totalPoints');
            pointsDisplay.classList.add('points-update');
            setTimeout(() => pointsDisplay.classList.remove('points-update'), 600);

        } catch (error) {
            console.error('Roll dice error:', error);
            this.showToast('操作出错，请重试', 'warning');
        } finally {
            // 确保按钮状态被重置
            this.updateRollButtons();
            
            // 强制更新一次UI
            setTimeout(() => this.updateUI(), 100);
        }
    }

    // 添加提示框方法
    showToast(message, type = 'info') {
        // 创建提示框元素
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.textContent = message;
        
        // 添加到页面
        document.body.appendChild(toast);
        
        // 动画效果
        setTimeout(() => toast.classList.add('show'), 10);
        
        // 自动移除
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // 添加特殊效果方法
    showSpecialEffect() {
        const container = document.querySelector('.dice-container');
        
        // 创建烟花效果
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // 随机颜色
            const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particle.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
            `;
            
            container.appendChild(particle);
            
            // 随机运动方向
            const angle = (Math.random() * Math.PI * 2);
            const velocity = 50 + Math.random() * 50;
            particle.animate([
                { transform: 'translate(0, 0) scale(1)' },
                { transform: `translate(${Math.cos(angle) * velocity}px, 
                             ${Math.sin(angle) * velocity}px) scale(0)` }
            ], {
                duration: 1000,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            });
            
            // 移除粒子
            setTimeout(() => particle.remove(), 1000);
        }
    }

    completeTask(taskId) {
        const task = this.data.tasks.find(t => t.id === taskId);
        if (task && !task.completed) {
            task.completed = true;
            task.diceRolled = false;
            this.data.stats.completedTasks++;
            this.data.saveTasks();
            this.data.saveStats();
            
            // 检查是否有未使用掷骰子机会已完成任务
            const hasUnusedCompletedTask = this.data.tasks.some(t => 
                t.completed && !t.diceRolled
            );
            document.getElementById('rollDice').disabled = !hasUnusedCompletedTask;
            
            this.playSound('complete');
            this.updateUI();
        }
    }

    checkRewards() {
        this.data.rewards.forEach(reward => {
            if (!reward.unlocked && this.data.points >= reward.pointsNeeded) {
                reward.unlocked = true;
                this.data.stats.unlockedRewards++;
                this.showRewardNotification(reward.name);
                this.playSound('unlock');  // 播放解锁奖励音效
            }
        });
        this.data.saveRewards();
        this.data.saveStats();
    }

    showRewardNotification(rewardName) {
        // 这里可以添加奖励解锁的动画效果
        alert(`恭喜！你解锁了奖励：${rewardName}`);
    }

    updateUI() {
        // 更新任务列表
        const taskList = document.querySelector('.task-list');
        if (taskList) {
            taskList.innerHTML = this.data.tasks.map(task => `
                <div class="task-card ${task.completed ? 'completed' : ''} ${task.diceRolled ? 'dice-used' : ''}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" 
                                   ${task.completed ? 'checked' : ''}
                                   onchange="app.completeTask(${task.id})" 
                                   ${task.completed ? 'disabled' : ''}>
                            <label class="form-check-label ${task.completed ? 'text-muted' : ''}">
                                ${task.name}
                            </label>
                        </div>
                        <div class="d-flex align-items-center">
                            ${task.completed ? 
                                `<span class="badge ${task.diceRolled ? 'bg-secondary' : 'bg-primary'} me-2">
                                    ${task.diceRolled ? '已掷骰子' : '可掷骰子'}
                                </span>` 
                                : ''}
                            <button class="btn btn-sm btn-outline-danger" onclick="app.deleteTask(${task.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <small class="text-muted">${task.description}</small>
                </div>
            `).join('');
        }

        // 更新奖励列表
        const rewardsList = document.querySelector('.rewards-list');
        rewardsList.innerHTML = this.data.rewards.map(reward => `
            <div class="reward-card ${reward.unlocked ? 'bg-light' : ''}">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">${reward.name}</h5>
                    <button class="btn btn-sm btn-outline-danger" onclick="app.deleteReward(${reward.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="progress mt-2">
                    <div class="progress-bar" role="progressbar" 
                         style="width: ${Math.min(100, (this.data.points / reward.pointsNeeded) * 100)}%">
                    </div>
                </div>
                <small class="text-muted">需要 ${reward.pointsNeeded} 点数 
                    ${reward.unlocked ? '(已解锁)' : `(还需 ${reward.pointsNeeded - this.data.points} 点)`}</small>
            </div>
        `).join('');

        // 新进度条
        const completedCount = this.data.tasks.filter(t => t.completed).length;
        const totalCount = this.data.tasks.length;
        const progressBar = document.querySelector('.progress-bar');
        if (totalCount > 0) {
            const percentage = (completedCount / totalCount) * 100;
            progressBar.style.width = `${percentage}%`;
            progressBar.textContent = `${Math.round(percentage)}%`;
        }

        // 更新点数显示
        document.getElementById('totalPoints').textContent = this.data.points;
        document.getElementById('totalPointsStats').textContent = this.data.points;

        // 更新统计数据
        document.getElementById('completedTasks').textContent = this.data.stats.completedTasks;
        document.getElementById('unlockedRewards').textContent = this.data.stats.unlockedRewards;
        
        // 更新骰子按钮状态
        this.updateRollButtons();
    }

    resetApp() {
        this.data.reset();
        
        document.getElementById('rollDice').disabled = true;
        
        this.updateUI();
        
        alert('所有数据已重置！');
        
        this.switchSection('tasks');
    }

    // 添加播放音效的方法
    playSound(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;  // 重置音频到开始
            sound.play().catch(e => console.log('Sound play failed:', e));
        }
    }

    // 添加连续掷骰子方法
    async multipleRoll(times) {
        const availableRolls = this.data.tasks.filter(task => 
            task.completed && !task.diceRolled
        ).length;

        if (availableRolls < times) {
            this.showToast(`需要${times}次掷骰机会才能${times}连抽！当前可用次数：${availableRolls}`, 'warning');
            return;
        }

        // 禁用所有骰子按钮
        const buttons = ['rollDice', 'rollDice5', 'rollDice10'];
        buttons.forEach(id => document.getElementById(id).disabled = true);

        let totalPoints = 0;
        const results = [];
        const tasksToUpdate = [];

        try {
            // 先收集所有要使用的任务
            const unusedTasks = this.data.tasks.filter(task => 
                task.completed && !task.diceRolled
            ).slice(0, times);

            // 执行所有掷骰子
            for (let i = 0; i < times; i++) {
                const result = Math.floor(Math.random() * 6) + 1;
                results.push(result);
                totalPoints += result;

                // 播放动画和音效
                await this.showRollAnimation(result);
                
                // 标记任务为已使用
                if (unusedTasks[i]) {
                    unusedTasks[i].diceRolled = true;
                    tasksToUpdate.push(unusedTasks[i]);
                }
            }

            // 批量更新数据
            this.data.points += totalPoints;
            this.data.saveTasks();
            this.data.savePoints();
            
            // 检查奖励并更新UI
            this.checkRewards();
            this.updateUI();

            // 显示结果
            await this.showMultiRollSummary(results, totalPoints);

        } catch (error) {
            console.error('Multiple roll error:', error);
            this.showToast('操作出错，请重试', 'warning');
        } finally {
            // 确保按钮状态被重置
            this.updateRollButtons();
            
            // 强制更新一次UI
            setTimeout(() => this.updateUI(), 100);
        }
    }

    // 显示单次掷骰动画
    async showRollAnimation(result) {
        const diceElement = document.querySelector('.dice');
        const dicefaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        
        this.playSound('dice');
        diceElement.classList.add('dice-spinning');
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
        diceElement.classList.remove('dice-spinning');
        diceElement.textContent = dicefaces[result - 1];
        
        await new Promise(resolve => setTimeout(resolve, 400));
    }

    // 显示连抽结果总结
    async showMultiRollSummary(results, totalPoints) {
        return new Promise((resolve) => {
            const modalDiv = document.createElement('div');
            modalDiv.className = 'modal fade';
            modalDiv.setAttribute('data-bs-backdrop', 'static');
            modalDiv.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-body text-center">
                            <h4>连抽结果</h4>
                            <div class="results-grid">
                                ${results.map((r, i) => `
                                    <span class="result-item" style="animation-delay: ${i * 0.1}s">
                                        ${r}
                                    </span>
                                `).join('')}
                            </div>
                            <div class="total-points mt-3">
                                总计获得 <span class="text-primary fw-bold">${totalPoints}</span> 点!
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modalDiv);
            const modal = new bootstrap.Modal(modalDiv);
            
            // 监听模态框隐藏事件
            modalDiv.addEventListener('hidden.bs.modal', () => {
                modalDiv.remove();
                this.updateUI(); // 模态框关闭后再次更新UI
                resolve();
            });

            modal.show();
            
            // 延长显示时间，让用户能看清结果
            setTimeout(() => {
                modal.hide();
            }, 3000);
        });
    }

    // 更新骰子按钮状态
    updateRollButtons() {
        const availableRolls = this.data.tasks.filter(task => 
            task.completed && !task.diceRolled
        ).length;
        
        // 更新按钮状态
        document.getElementById('rollDice').disabled = availableRolls < 1;
        document.getElementById('rollDice5').disabled = availableRolls < 5;
        document.getElementById('rollDice10').disabled = availableRolls < 10;
        
        // 更新可用次数显示
        const availableRollsElement = document.getElementById('availableRolls');
        if (availableRollsElement) {
            availableRollsElement.textContent = availableRolls;
        }
    }

    // 添加删除任务方法
    deleteTask(taskId) {
        if (confirm('确定要删除这个任务吗？')) {
            const taskIndex = this.data.tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                // 如果删除已完成的任务，更新统计数据
                if (this.data.tasks[taskIndex].completed) {
                    this.data.stats.completedTasks--;
                }
                this.data.tasks.splice(taskIndex, 1);
                this.data.saveTasks();
                this.data.saveStats();
                this.updateUI();
                this.showToast('任务已删除', 'info');
            }
        }
    }

    // 添加删除奖励方法
    deleteReward(rewardId) {
        if (confirm('确定要删除这个奖励吗？')) {
            const rewardIndex = this.data.rewards.findIndex(r => r.id === rewardId);
            if (rewardIndex !== -1) {
                // 如果删除已解锁的奖励，更新统计数据
                if (this.data.rewards[rewardIndex].unlocked) {
                    this.data.stats.unlockedRewards--;
                }
                this.data.rewards.splice(rewardIndex, 1);
                this.data.saveRewards();
                this.data.saveStats();
                this.updateUI();
                this.showToast('奖励已删除', 'info');
            }
        }
    }

    // 在导航处理代码中添加新页面
    handleNavigation() {
        // 获取所有导航链接
        const navLinks = document.querySelectorAll('.nav-link');
        
        // 为每个导航链接添加点击事件
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // 移除所有导航链接的激活状态
                navLinks.forEach(l => l.classList.remove('active'));
                
                // 添加当前点击链接的激活状态
                link.classList.add('active');
                
                // 获取目标页面ID
                const targetId = link.getAttribute('href').substring(1);
                
                // 隐藏所有内容区域
                document.querySelectorAll('.content-section').forEach(section => {
                    section.style.display = 'none';
                });
                
                // 显示目标内容区域
                document.getElementById(targetId).style.display = 'block';
            });
        });
    }
}// 初始化应用
const app = new App(); 

