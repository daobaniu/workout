export type Equipment = "bodyweight" | "dumbbell" | "barbell" | "machine" | "band";

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "legs"
  | "glutes"
  | "core"
  | "arms"
  | "full"
  | "cardio";

/** 媒体资源预留：后续可补图/视频，不影响现有逻辑 */
export type ExerciseMedia = {
  imageUrl?: string;
  videoUrl?: string;
};

export type Exercise = {
  id: string;
  name: string;
  muscles: MuscleGroup[];
  equipment: Equipment[];
  defaultSets: number;
  defaultReps: string;
  /** 做法步骤（文字） */
  howTo: string;
  /** 易伤点 / 常见错误 / 安全注意 */
  cautions: string[];
  homeAlternative?: string;
  notes?: string;
  media?: ExerciseMedia;
};

export const exercises: Exercise[] = [
  {
    id: "pushup",
    name: "俯卧撑",
    muscles: ["chest", "arms"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "8-15",
    howTo:
      "双手略宽于肩撑地，身体从头到脚成一条直线。下放时胸口接近地面，再推起还原。全程核心收紧，不要塌腰或撅臀。",
    cautions: [
      "肘关节不要完全张开到 90 度外展，约 45 度更护肩",
      "颈椎保持中立，不要过度抬头或低头",
      "肩痛时先改跪姿俯卧撑或缩小活动幅度",
    ],
    notes: "核心收紧，肘关节约 45 度",
  },
  {
    id: "knee_pushup",
    name: "跪姿俯卧撑",
    muscles: ["chest", "arms"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "10-15",
    howTo:
      "双膝着地，双手撑地略宽于肩，躯干仍保持一条直线。下放胸口接近地面后推起。适合标准俯卧撑尚吃力时的退阶。",
    cautions: [
      "膝盖下方可垫软垫，避免跪疼分心导致塌腰",
      "不要只用手臂硬撑，胸与核心仍要参与",
    ],
  },
  {
    id: "dumbbell_press",
    name: "哑铃卧推",
    muscles: ["chest", "arms"],
    equipment: ["dumbbell"],
    defaultSets: 3,
    defaultReps: "8-12",
    homeAlternative: "pushup",
    howTo:
      "仰卧凳上（或地面），双手持哑铃于胸侧，掌心朝前。推至手臂接近伸直但不锁死，再缓慢下放至上臂约与地面平行。",
    cautions: [
      "下放幅度过大易伤肩，感到肩前侧刺痛立即减小幅度",
      "推起时不要快速撞击哑铃，控制轨迹",
      "腰部轻微自然弧度即可，不要过度桥腰借力",
    ],
  },
  {
    id: "bench_press",
    name: "杠铃卧推",
    muscles: ["chest", "arms"],
    equipment: ["barbell"],
    defaultSets: 4,
    defaultReps: "6-10",
    homeAlternative: "dumbbell_press",
    howTo:
      "仰卧卧推凳，握距略宽于肩。杠铃下放至胸口中下部，再垂直推起。双脚踩实地面，肩胛骨轻微后收下沉稳定肩关节。",
    cautions: [
      "大重量务必有保护人或安全杆，避免力竭压胸",
      "杠铃轨迹不要砸锁骨，落点约胸口中线偏下",
      "肩痛、手腕过度背屈时减重并检查握距",
    ],
  },
  {
    id: "incline_dumbbell_press",
    name: "上斜哑铃卧推",
    muscles: ["chest", "shoulders"],
    equipment: ["dumbbell"],
    defaultSets: 3,
    defaultReps: "8-12",
    howTo:
      "凳面调约 30–45 度上斜，动作同哑铃卧推。更侧重上胸与前束，下放时肘部略低于肩线即可。",
    cautions: [
      "倾斜角度过大（接近 60 度）会过度转成推肩，肩压更大",
      "肩峰撞击感时降低角度或改平卧",
    ],
  },
  {
    id: "band_row",
    name: "弹力带划船",
    muscles: ["back", "arms"],
    equipment: ["band", "bodyweight"],
    defaultSets: 3,
    defaultReps: "12-15",
    howTo:
      "弹力带固定于前方或脚下，双手拉向躯干两侧，肘贴近身体，肩胛骨向后夹紧，再缓慢还原。躯干保持直立，不要大幅晃动借力。",
    cautions: [
      "耸肩发力容易落在斜方肌，注意肩下沉",
      "弹力带回弹要控速，避免猛甩伤肘腕",
    ],
  },
  {
    id: "dumbbell_row",
    name: "哑铃单臂划船",
    muscles: ["back", "arms"],
    equipment: ["dumbbell"],
    defaultSets: 3,
    defaultReps: "8-12",
    homeAlternative: "band_row",
    howTo:
      "一侧手膝支撑凳面，另一手持哑铃自然下垂。将哑铃拉向髋侧/腰侧，肘贴近身体，顶峰稍停再下放。两侧交替完成。",
    cautions: [
      "腰不要大幅扭转或塌陷，保持躯干稳定",
      "拉到最高点不要耸肩，肩胛带动而非只弯肘",
    ],
  },
  {
    id: "barbell_row",
    name: "杠铃划船",
    muscles: ["back", "arms"],
    equipment: ["barbell"],
    defaultSets: 4,
    defaultReps: "6-10",
    homeAlternative: "dumbbell_row",
    howTo:
      "髋铰链俯身，背部中立，杠铃贴近小腿前方。将杠铃拉向下腹/肚脐附近，肩胛后夹，再控速下放。",
    cautions: [
      "圆背硬拉式划船最易伤腰，始终保持脊柱中立",
      "重量过大导致甩腰借力时立刻减重",
      "下背不适时改用哑铃单臂划船或坐姿器械",
    ],
  },
  {
    id: "lat_pulldown",
    name: "高位下拉",
    muscles: ["back", "arms"],
    equipment: ["machine"],
    defaultSets: 3,
    defaultReps: "8-12",
    homeAlternative: "band_row",
    howTo:
      "坐姿大腿固定，双手宽握横杆。将杆拉至锁骨/上胸前，肘向下向后走，肩胛下沉后夹，再缓慢还原。",
    cautions: [
      "不要把杆猛拉到脑后（颈后下拉），肩关节风险更高",
      "起身借力作弊会伤下背，躯干可微后倾但不要大幅晃",
    ],
  },
  {
    id: "pullup",
    name: "引体向上",
    muscles: ["back", "arms"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "5-10",
    homeAlternative: "band_row",
    howTo:
      "正握单杠悬垂，肩下沉启动，将胸口拉向杠，下颌过杠后控速下放至手臂接近伸直。做不了可加弹力带辅助或改高位下拉。",
    cautions: [
      "避免甩腿借力猛拉，肩关节与肘容易过载",
      "肩痛或肩峰撞击感时改窄握辅助或退阶",
      "完全放松悬垂若肩不稳，可保留轻微张力",
    ],
  },
  {
    id: "overhead_press",
    name: "哑铃推举",
    muscles: ["shoulders", "arms"],
    equipment: ["dumbbell"],
    defaultSets: 3,
    defaultReps: "8-12",
    howTo:
      "坐姿或站姿，哑铃位于肩侧。向上推至手臂接近伸直，肘不要完全锁死；下放时肘略低于肩线。核心收紧，避免过度塌腰。",
    cautions: [
      "腰椎过度超伸（塌腰）是常见伤腰原因，肋骨下沉、臀收紧",
      "肩活动度不足时不要强求完全过头锁定",
      "手腕尽量与前臂成直线，避免过度背屈",
    ],
  },
  {
    id: "lateral_raise",
    name: "侧平举",
    muscles: ["shoulders"],
    equipment: ["dumbbell"],
    defaultSets: 3,
    defaultReps: "12-15",
    howTo:
      "双手持轻哑铃于体侧，肘微屈。向两侧抬至约与肩同高（略低于亦可），小拇指略高于拇指的「倒水」感，再缓慢放下。",
    cautions: [
      "重量过大会耸肩代偿，斜方吃力且肩压大",
      "不要抬过耳朵过高，肩峰易受压",
      "摆动甩起不算有效刺激，控速更重要",
    ],
  },
  {
    id: "pike_pushup",
    name: "派克俯卧撑",
    muscles: ["shoulders"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "8-12",
    howTo:
      "高臀、身体呈倒 V，双手撑地。弯肘让头顶朝地面方向下放，再推起。主要练肩，像倒立推举的退阶。",
    cautions: [
      "颈椎不要猛磕地面，头与手之间留空间",
      "手腕灵活度不够可握俯卧撑支架或改跪姿推举",
      "肩不稳定时减小幅度，循序渐进",
    ],
  },
  {
    id: "bodyweight_squat",
    name: "徒手深蹲",
    muscles: ["legs", "glutes"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "12-20",
    howTo:
      "双脚约与肩同宽，脚尖略外展。髋后坐同时屈膝下蹲，膝盖朝脚尖方向，起身时脚掌踩实推起。胸口保持微抬。",
    cautions: [
      "膝盖过度内扣易伤膝，有意识向外「打开」",
      "脚跟抬起说明踝灵活度或重心前移，可垫高脚跟练习",
      "下背圆背塌陷时减小深度，先练髋铰链感",
    ],
  },
  {
    id: "goblet_squat",
    name: "高脚杯深蹲",
    muscles: ["legs", "glutes"],
    equipment: ["dumbbell"],
    defaultSets: 3,
    defaultReps: "10-15",
    homeAlternative: "bodyweight_squat",
    howTo:
      "双手抱哑铃于胸前（高脚杯姿势），下蹲时肘在膝内侧穿过感，更容易保持直立躯干。其余同深蹲要点。",
    cautions: [
      "哑铃过重导致上身过度前倾时减重",
      "膝盖仍需跟随脚尖方向，避免内扣",
    ],
  },
  {
    id: "back_squat",
    name: "杠铃深蹲",
    muscles: ["legs", "glutes"],
    equipment: ["barbell"],
    defaultSets: 4,
    defaultReps: "6-10",
    homeAlternative: "goblet_squat",
    howTo:
      "杠铃置于斜方肌上方（高杠）或后三角（低杠），双手握稳。髋膝协同下蹲至合适深度，再驱动站起。全程脊柱中立、核心加压。",
    cautions: [
      "务必设置安全杆，力竭有退路",
      "膝盖内扣、脚跟抬起、下背圆背是三大高危信号，出现即减重",
      "深度以髋膝踝舒适为准，不要为了「屁股碰地」牺牲姿势",
    ],
  },
  {
    id: "leg_press",
    name: "腿举",
    muscles: ["legs", "glutes"],
    equipment: ["machine"],
    defaultSets: 3,
    defaultReps: "10-15",
    homeAlternative: "goblet_squat",
    howTo:
      "坐上腿举机，双脚置于踏板中部。解锁后缓慢屈膝下放，至膝盖约 90 度或髋能舒适承受的位置，再蹬起接近伸直但不锁死膝盖。",
    cautions: [
      "下放过深致骨盆后倾（屁股离开靠垫）极易伤腰",
      "膝盖完全弹直锁死有关节风险，留一点微屈",
      "双脚过低过窄会增加膝前侧压力",
    ],
  },
  {
    id: "lunge",
    name: "弓步蹲",
    muscles: ["legs", "glutes"],
    equipment: ["bodyweight", "dumbbell"],
    defaultSets: 3,
    defaultReps: "10/腿",
    howTo:
      "一脚向前迈出，后膝向地面靠近（轻触或不触地），前膝约在脚上方，躯干直立，再蹬回。可原地或向前走步完成。",
    cautions: [
      "前膝大幅超过脚尖并内扣时膝压大，步幅与对齐全更重要",
      "平衡差时先扶墙或缩小步幅",
      "髋屈肌很紧时可减小后腿伸展幅度",
    ],
  },
  {
    id: "rdl",
    name: "罗马尼亚硬拉",
    muscles: ["legs", "glutes", "back"],
    equipment: ["dumbbell", "barbell"],
    defaultSets: 3,
    defaultReps: "8-12",
    howTo:
      "双手持铃，微屈膝固定。以髋铰链向后推臀，躯干前倾，杠贴近腿前侧下放至腘绳肌明显拉伸，再挺髋站起。背部始终中立。",
    cautions: [
      "最关键：禁止圆背硬拉，腰会最先受伤",
      "膝盖不要额外大幅弯曲变成普通硬拉",
      "下放到柔韧极限即可，不必强求铃片碰地",
    ],
    notes: "髋铰链，背部保持中立",
  },
  {
    id: "hip_thrust",
    name: "臀桥/髋推进",
    muscles: ["glutes"],
    equipment: ["bodyweight", "dumbbell", "barbell"],
    defaultSets: 3,
    defaultReps: "10-15",
    howTo:
      "上背靠凳，屈膝踩地。驱动髋向上推到躯干与大腿接近一条直线，顶峰夹紧臀部 1 秒，再下放。下巴微收，避免过度仰头。",
    cautions: [
      "过度挺腰用竖脊肌代偿，应想着「用屁股推」而非「折腰」",
      "杠铃版本注意垫护髋，避免压痛导致姿势变形",
    ],
  },
  {
    id: "calf_raise",
    name: "提踵",
    muscles: ["legs"],
    equipment: ["bodyweight", "dumbbell", "machine"],
    defaultSets: 3,
    defaultReps: "12-20",
    howTo:
      "前脚掌支撑，脚跟尽量下放感受拉伸，再踮起至最高点稍停。可双腿或单腿，扶墙维持平衡。",
    cautions: [
      "踝不稳或近期扭伤时先双腿、减小幅度",
      "不要弹震式甩起，控速更护跟腱",
    ],
  },
  {
    id: "plank",
    name: "平板支撑",
    muscles: ["core"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "30-60秒",
    howTo:
      "肘或手撑地，身体成一条直线。收紧腹部与臀部，目视地面，均匀呼吸，坚持目标时间。",
    cautions: [
      "塌腰或撅臀都会把压力丢给腰椎",
      "肩胛不要过度塌陷，微微撑地推开地面",
      "腰痛出现立即停止，改死虫式等更友好动作",
    ],
  },
  {
    id: "dead_bug",
    name: "死虫式",
    muscles: ["core"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "8/侧",
    howTo:
      "仰卧，手臂向上、髋膝约 90 度。下背轻贴地面，对侧手脚缓慢伸远，再收回换边。全程下背不离开地面。",
    cautions: [
      "下背拱起说明核心失控，减小幅度或先做单侧",
      "动作宜慢，追求稳定而非速度",
    ],
  },
  {
    id: "bird_dog",
    name: "鸟狗式",
    muscles: ["core", "back"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "8/侧",
    howTo:
      "四点跪撑，对侧手脚同时伸直成一条线，骨盆尽量不左右晃，稍停再收回换边。",
    cautions: [
      "腰过度塌陷或骨盆大幅扭转时减幅",
      "膝盖跪垫保护，避免疼痛分心",
    ],
  },
  {
    id: "bicycle_crunch",
    name: "自行车卷腹",
    muscles: ["core"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "12-20",
    howTo:
      "仰卧，双手轻触头侧，轮流让对侧肘靠近对侧膝，腿做踩自行车动作。用腹肌发力，不要用手猛拉脖子。",
    cautions: [
      "手扯脖子易伤颈椎，手只轻托",
      "下背不适时改死虫式或平板",
    ],
  },
  {
    id: "bicep_curl",
    name: "哑铃弯举",
    muscles: ["arms"],
    equipment: ["dumbbell"],
    defaultSets: 3,
    defaultReps: "10-15",
    howTo:
      "上臂贴躯干两侧，肘为轴将哑铃弯起至肩前，再缓慢下放。可坐可站，避免前后甩动。",
    cautions: [
      "借腰甩起易伤下背，减重控姿",
      "肘过度前移或外展会改变刺激，保持肘位稳定",
    ],
  },
  {
    id: "tricep_extension",
    name: "臂屈伸/过头臂屈伸",
    muscles: ["arms"],
    equipment: ["dumbbell", "bodyweight"],
    defaultSets: 3,
    defaultReps: "10-15",
    howTo:
      "过头臂屈伸：双手持铃于头后，上臂贴近耳侧，仅前臂上下活动伸直。也可做双杠臂屈伸或凳上反向臂屈伸。",
    cautions: [
      "肘完全锁死弹震易伤肘",
      "肩灵活度差时不要强求大重量过头，可改绳索下压类动作",
      "手腕保持中立，避免过度折腕",
    ],
  },
  {
    id: "glute_bridge",
    name: "臀桥",
    muscles: ["glutes", "core"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "12-20",
    howTo:
      "仰卧屈膝，双脚踩地约与髋同宽。脚跟发力把髋推起，顶峰夹臀，再下放。比髋推进更简单的居家版本。",
    cautions: [
      "不要过度挺腰，下巴微收、肋骨下沉",
      "膝内扣时有意识外展膝",
    ],
  },
  {
    id: "mountain_climber",
    name: "登山跑",
    muscles: ["core", "full", "cardio"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "20-40秒",
    howTo:
      "高位平板姿势，交替将膝盖快速拉向胸口，像原地奔跑。肩膀压在手腕上方，髋不要大幅上下晃。",
    cautions: [
      "手腕痛可改肘撑或减少时间",
      "塌腰冲刺会伤腰，先把平板做稳再加速",
    ],
  },
  {
    id: "jumping_jack",
    name: "开合跳",
    muscles: ["full", "cardio"],
    equipment: ["bodyweight"],
    defaultSets: 2,
    defaultReps: "30-45秒",
    howTo:
      "站立开始，跳起同时双脚分开、双手过头击掌或靠近，再跳回并拢。节奏均匀，作为热身很合适。",
    cautions: [
      "膝关节或踝不稳时可改步进式开合（不跳跃）",
      "落地轻柔，避免脚后跟重砸",
    ],
    notes: "热身用",
  },
  {
    id: "face_pull",
    name: "面拉",
    muscles: ["shoulders", "back"],
    equipment: ["band", "machine"],
    defaultSets: 3,
    defaultReps: "12-15",
    howTo:
      "绳索或弹力带约面高，拉向面部两侧，肘高、外旋肩（像展示肱二头），肩胛后夹，再控速还原。利于肩袖与上背健康。",
    cautions: [
      "重量过大变成划船耸肩，失去外旋意义",
      "不要猛甩到脸上，控轨迹",
    ],
  },
  {
    id: "chest_fly",
    name: "哑铃飞鸟",
    muscles: ["chest"],
    equipment: ["dumbbell"],
    defaultSets: 3,
    defaultReps: "10-15",
    howTo:
      "仰卧持哑铃，掌心相对，肘微屈固定。双臂向两侧打开至胸有拉伸，再沿圆弧夹回上方。像「环抱大树」。",
    cautions: [
      "肘伸太直、下放太深是肩伤高发姿势，宁浅勿深",
      "重量应明显轻于卧推，飞鸟不是练大重量的动作",
    ],
  },

  // —— 有氧 / 心肺 ——
  {
    id: "brisk_walk",
    name: "快走",
    muscles: ["cardio", "legs"],
    equipment: ["bodyweight"],
    defaultSets: 1,
    defaultReps: "20-40分钟",
    howTo:
      "以能稍喘、仍可简短说话的节奏连续行走。摆臂自然，步幅适中，尽量走平路或缓坡。适合恢复日与入门燃脂。",
    cautions: [
      "膝踝不适时缩短单次时长，改平地、穿缓震鞋",
      "长时间低头看手机易塌腰、步态变差",
    ],
    notes: "低冲击有氧",
  },
  {
    id: "jog",
    name: "慢跑",
    muscles: ["cardio", "legs"],
    equipment: ["bodyweight"],
    defaultSets: 1,
    defaultReps: "20-40分钟",
    howTo:
      "轻松可持续的配速跑步，呼吸节奏稳定（如两步一吸、两步一呼）。落地尽量前中足轻柔，身体略前倾但不塌腰。",
    cautions: [
      "初跑者先走跑结合，避免一上来连续长距离",
      "膝/小腿/足底痛时立刻减量或改快走、骑行、游泳",
      "跑前热身、跑后拉伸小腿与髋屈肌",
    ],
  },
  {
    id: "run_intervals",
    name: "间歇跑",
    muscles: ["cardio", "legs"],
    equipment: ["bodyweight"],
    defaultSets: 1,
    defaultReps: "20-30分钟",
    howTo:
      "热身后交替「较快跑 + 慢跑/快走恢复」，例如 1 分钟快 + 2 分钟慢，重复若干组。总时长含热身放松。",
    cautions: [
      "有基础有氧后再做；新手优先稳态慢跑",
      "快段不必冲刺到力竭，以可控加速为主",
      "地面湿滑、夜间光线不足时降低强度",
    ],
    notes: "强度高于慢跑，频率勿过高",
  },
  {
    id: "swim",
    name: "游泳",
    muscles: ["cardio", "full"],
    equipment: ["bodyweight"],
    defaultSets: 1,
    defaultReps: "20-40分钟",
    howTo:
      "以自由泳或自己最稳的泳姿连续游，中途可扶边休息。换气均匀，身体尽量水平，减少拖曳。不会游泳可用浮板踢腿或轻松蛙泳代替。",
    cautions: [
      "下水前热身肩与髋；肩痛时少做大力蝶泳/仰泳过伸",
      "泳池拥挤时注意避让，勿屏气过久",
      "冷水或疲劳时缩短时间，优先安全",
    ],
    notes: "低冲击全身有氧",
  },
  {
    id: "cycling_outdoor",
    name: "户外骑行",
    muscles: ["cardio", "legs"],
    equipment: ["bodyweight"],
    defaultSets: 1,
    defaultReps: "30-60分钟",
    howTo:
      "座椅高度使踩到底时膝微屈。保持匀速或缓坡爬升，核心微收，肩放松。交通路况复杂时以降速保安全优先。",
    cautions: [
      "必戴头盔；夜间反光装备",
      "膝前侧痛时检查座高、降低齿比",
      "长时间骑行注意补水与颈肩放松",
    ],
  },
  {
    id: "stationary_bike",
    name: "健身车",
    muscles: ["cardio", "legs"],
    equipment: ["machine"],
    defaultSets: 1,
    defaultReps: "20-40分钟",
    howTo:
      "调好座高后以中等阻力持续踩踏，或跟课程间歇。上身稳定，不要大幅左右晃。适合雨天或护膝替代跑步。",
    cautions: [
      "阻力过大导致膝外翻/耸肩时减档",
      "坐骨压痛可微调前后位置或垫软垫",
    ],
  },
  {
    id: "elliptical",
    name: "椭圆机",
    muscles: ["cardio", "legs"],
    equipment: ["machine"],
    defaultSets: 1,
    defaultReps: "20-40分钟",
    howTo:
      "双手扶杆或随机器摆臂，脚掌贴实踏板，全程椭圆轨迹。阻力与坡度调到能持续说话但不轻松的程度。",
    cautions: [
      "踩空或脚跟离板易扭踝，始终踩实",
      "腰椎不适时减小幅度、放慢节奏",
    ],
    notes: "低冲击，适合替代跑步",
  },
  {
    id: "rower_cardio",
    name: "划船机",
    muscles: ["cardio", "back", "legs"],
    equipment: ["machine"],
    defaultSets: 1,
    defaultReps: "15-30分钟",
    howTo:
      "顺序：蹬腿 → 微后仰开身 → 拉桨至下腹；回桨相反。保持背平、核心收紧，用腿驱动而非硬拽手臂。",
    cautions: [
      "圆背猛拉最易伤腰，先练空桨节奏",
      "阻力档位过高时减档保动作质量",
      "下背伤病史者先短时、低阻，或改其他有氧",
    ],
  },
  {
    id: "jump_rope",
    name: "跳绳",
    muscles: ["cardio", "legs", "full"],
    equipment: ["bodyweight"],
    defaultSets: 3,
    defaultReps: "1-3分钟",
    howTo:
      "绳长踩住中间、两端约到腋下。小跳、脚尖前掌着地，肘靠近身体用手腕摇绳。可交替休息，累计有效跳动时间。",
    cautions: [
      "膝踝不稳、足底筋膜炎时改无绳模拟或其它有氧",
      "天花板过低、地面过硬时注意安全与缓震",
      "初学者先短间歇，避免小腿过度酸胀",
    ],
  },
  {
    id: "stair_climb",
    name: "爬楼",
    muscles: ["cardio", "legs", "glutes"],
    equipment: ["bodyweight", "machine"],
    defaultSets: 1,
    defaultReps: "15-30分钟",
    howTo:
      "真实楼梯或台阶机均可。全脚掌或前掌稳定踩实，躯干直立，可用扶手保平衡但少借力。可走跑结合。",
    cautions: [
      "下楼冲击大，护膝者可只爬上、乘电梯下或改椭圆机",
      "台阶机勿整个人挂在扶手上，失去训练意义且易伤肩",
    ],
  },
  {
    id: "hiking",
    name: "徒步",
    muscles: ["cardio", "legs", "glutes"],
    equipment: ["bodyweight"],
    defaultSets: 1,
    defaultReps: "45-90分钟",
    howTo:
      "选择匹配体能的路线与配速，上坡可缩短步幅。背包尽量轻、贴背。中途补水，按里程或爬升计有效有氧时间。",
    cautions: [
      "下坡控速，避免膝过伸冲击",
      "陌生山路留足白天时间，注意补给与通讯",
    ],
  },
];

export function getExercise(id: string) {
  return exercises.find((e) => e.id === id);
}

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "胸",
  back: "背",
  shoulders: "肩",
  legs: "腿",
  glutes: "臀",
  core: "核心",
  arms: "手臂",
  full: "全身",
  cardio: "有氧",
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  bodyweight: "徒手",
  dumbbell: "哑铃",
  barbell: "杠铃",
  machine: "器械",
  band: "弹力带",
};

/** 居家常用器械；健身房展示全部 */
export function equipmentOptionsForPlace(
  place: "home" | "gym",
): Array<Equipment | "all"> {
  if (place === "home") {
    return ["all", "bodyweight", "dumbbell", "band"];
  }
  return ["all", "bodyweight", "dumbbell", "barbell", "machine", "band"];
}

export function listExercises(filter?: {
  muscle?: MuscleGroup | "all";
  equipment?: Equipment | "all";
  query?: string;
  /** 居家「全部」时默认排除纯杠铃/器械动作 */
  place?: "home" | "gym";
}): Exercise[] {
  const muscle = filter?.muscle && filter.muscle !== "all" ? filter.muscle : null;
  const equipment =
    filter?.equipment && filter.equipment !== "all" ? filter.equipment : null;
  const q = filter?.query?.trim().toLowerCase() ?? "";
  const homeFriendlyOnly =
    filter?.place === "home" && (!filter.equipment || filter.equipment === "all");

  return exercises.filter((e) => {
    if (muscle && !e.muscles.includes(muscle)) return false;
    if (equipment && !e.equipment.includes(equipment)) return false;
    if (homeFriendlyOnly) {
      const ok = e.equipment.some(
        (eq) => eq === "bodyweight" || eq === "dumbbell" || eq === "band",
      );
      if (!ok) return false;
    }
    if (q && !e.name.toLowerCase().includes(q) && !e.id.includes(q)) {
      return false;
    }
    return true;
  });
}

/** 解析动作说明：优先动作库，自定义名称则给通用提示 */
export function resolveExerciseGuide(input: {
  exerciseId?: string;
  name: string;
  notes?: string;
}) {
  const meta = input.exerciseId ? getExercise(input.exerciseId) : undefined;
  const byName = meta ?? exercises.find((e) => e.name === input.name);
  if (byName) {
    return {
      name: byName.name,
      howTo: byName.howTo,
      cautions: byName.cautions,
      notes: input.notes ?? byName.notes,
      imageUrl: byName.media?.imageUrl,
      videoUrl: byName.media?.videoUrl,
    };
  }
  return {
    name: input.name,
    howTo: "该动作为自定义条目。建议：全程控制速度，关节对线，疼痛（尤其刺痛）立即停止。",
    cautions: [
      "不确定做法时可在对话里问「XX 怎么做」",
      "先用空杆/徒手找手感，再加负荷",
    ],
    notes: input.notes,
    imageUrl: undefined as string | undefined,
    videoUrl: undefined as string | undefined,
  };
}
