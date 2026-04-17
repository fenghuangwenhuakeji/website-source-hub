from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..domain.user import AgeGroup, UserProfile
import uuid

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

class OnboardingRequest(BaseModel):
    age: int
    nickname: str

@router.post("/onboard")
async def onboard_user(req: OnboardingRequest):
    """
    用户初始化接口：根据年龄返回对应的用户组配置
    """
    if req.age < 6:
        raise HTTPException(status_code=400, detail="本应用仅适用于6岁以上用户")
    
    age_group = UserProfile.determine_age_group(req.age)
    user_id = str(uuid.uuid4())
    
    # 模拟保存用户 (实际应存入数据库)
    profile = UserProfile(
        user_id=user_id,
        age=req.age,
        age_group=age_group
    )
    
    return {
        "user_id": user_id,
        "age_group": age_group,
        "config": get_ui_config(age_group)
    }

def get_ui_config(group: AgeGroup):
    """根据年龄组返回UI主题配置"""
    if group == AgeGroup.CHILD:
        return {"theme": "playful", "primary_color": "#FFB347", "font_size": "large"}
    elif group == AgeGroup.TEEN:
        return {"theme": "cool", "primary_color": "#87CEEB", "font_size": "medium"}
    else:
        return {"theme": "professional", "primary_color": "#2C3E50", "font_size": "normal"}
